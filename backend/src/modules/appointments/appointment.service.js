import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";

const PENDING_HOLD_MINUTES = 10;

function isValidUuid(value) {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value,
        )
    );
}

function parseDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new AppError("Invalid appointment date/time", 400);
    }

    return date;
}

async function expirePendingAppointment(appointmentId) {
    const now = new Date();

    const { data: expiredAppointment, error } = await supabase
        .from("appointments")
        .update({
            status: "cancelled",
            pending_until: null,
        })
        .eq("id", appointmentId)
        .eq("status", "pending")
        .not("pending_until", "is", null)
        .lte("pending_until", now.toISOString())
        .select("id, status, pending_until")
        .maybeSingle();

    if (error) {
        throw error;
    }

    return expiredAppointment;
}

async function expirePendingAppointments() {
    const now = new Date();

    const { error } = await supabase
        .from("appointments")
        .update({
            status: "cancelled",
            pending_until: null,
        })
        .eq("status", "pending")
        .not("pending_until", "is", null)
        .lte("pending_until", now.toISOString());

    if (error) {
        throw error;
    }
}

export async function createAppointment(data) {
    const {
        patientId,
        clinicianId,
        treatmentId,
        startsAt,
        comfortMode = "standard",
        patientNotes = null,
    } = data;

    if (!isValidUuid(patientId)) {
        throw new AppError("Valid patientId is required", 400);
    }

    if (!isValidUuid(clinicianId)) {
        throw new AppError("Valid clinicianId is required", 400);
    }

    if (!isValidUuid(treatmentId)) {
        throw new AppError("Valid treatmentId is required", 400);
    }

    if (!startsAt) {
        throw new AppError("startsAt is required", 400);
    }

    if (!["standard", "extra_gentle"].includes(comfortMode)) {
        throw new AppError("comfortMode must be standard or extra_gentle", 400);
    }

    const startDate = parseDate(startsAt);

    if (startDate <= new Date()) {
        throw new AppError("Appointment time must be in the future", 400);
    }

    // --------------------------------------------------
    // 1. Verify patient
    // --------------------------------------------------

    const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id, first_name, last_name, phone, email")
        .eq("id", patientId)
        .maybeSingle();

    if (patientError) {
        throw patientError;
    }

    if (!patient) {
        throw new AppError("Patient not found", 404);
    }

    // --------------------------------------------------
    // 2. Verify clinician
    // --------------------------------------------------

    const { data: clinician, error: clinicianError } = await supabase
        .from("clinicians")
        .select("id, name, active")
        .eq("id", clinicianId)
        .eq("active", true)
        .maybeSingle();

    if (clinicianError) {
        throw clinicianError;
    }

    if (!clinician) {
        throw new AppError("Clinician not found or inactive", 404);
    }

    // --------------------------------------------------
    // 3. Verify treatment
    // --------------------------------------------------

    const { data: treatment, error: treatmentError } = await supabase
        .from("treatments")
        .select(
            `
      id,
      name,
      duration_minutes,
      price_type,
      price_min,
      price_max,
      deposit_amount,
      active
    `,
        )
        .eq("id", treatmentId)
        .eq("active", true)
        .maybeSingle();

    if (treatmentError) {
        throw treatmentError;
    }

    if (!treatment) {
        throw new AppError("Treatment not found or inactive", 404);
    }

    // --------------------------------------------------
    // 4. Verify clinician can perform treatment
    // --------------------------------------------------

    const { data: clinicianTreatment, error: mappingError } = await supabase
        .from("clinician_treatments")
        .select("clinician_id, treatment_id")
        .eq("clinician_id", clinicianId)
        .eq("treatment_id", treatmentId)
        .maybeSingle();

    if (mappingError) {
        throw mappingError;
    }

    if (!clinicianTreatment) {
        throw new AppError(
            "This clinician does not provide the selected treatment",
            400,
        );
    }

    // --------------------------------------------------
    // 5. Calculate appointment end time
    // --------------------------------------------------

    const endDate = new Date(
        startDate.getTime() + treatment.duration_minutes * 60 * 1000,
    );

    // --------------------------------------------------
    // 6. Verify the requested slot is inside availability
    // --------------------------------------------------

    const dayOfWeek = startDate.getDay();

    const startTime = startDate.toISOString().slice(11, 19);
    const endTime = endDate.toISOString().slice(11, 19);

    const { data: schedules, error: scheduleError } = await supabase
        .from("clinician_availability")
        .select("start_time, end_time")
        .eq("clinician_id", clinicianId)
        .eq("day_of_week", dayOfWeek)
        .eq("active", true);

    if (scheduleError) {
        throw scheduleError;
    }

    const fitsSchedule =
        schedules &&
        schedules.some((schedule) => {
            return startTime >= schedule.start_time && endTime <= schedule.end_time;
        });

    if (!fitsSchedule) {
        throw new AppError(
            "The selected time is outside the clinician availability",
            400,
        );
    }

    // --------------------------------------------------
    // 7. Check time off
    // --------------------------------------------------

    const { data: timeOff, error: timeOffError } = await supabase
        .from("clinician_time_off")
        .select("id")
        .eq("clinician_id", clinicianId)
        .lt("starts_at", endDate.toISOString())
        .gt("ends_at", startDate.toISOString())
        .limit(1);

    if (timeOffError) {
        throw timeOffError;
    }

    if (timeOff && timeOff.length) {
        throw new AppError(
            "The clinician is unavailable at the selected time",
            409,
        );
    }

    // --------------------------------------------------
    // 8. Check existing appointments
    // --------------------------------------------------

    const now = new Date();

    const { data: existingAppointments, error: appointmentError } = await supabase
        .from("appointments")
        .select("id, status, pending_until")
        .eq("clinician_id", clinicianId)
        .in("status", ["pending", "confirmed"])
        .lt("starts_at", endDate.toISOString())
        .gt("ends_at", startDate.toISOString());

    if (appointmentError) {
        throw appointmentError;
    }

    const activeConflict =
        existingAppointments &&
        existingAppointments.some((appointment) => {
            if (appointment.status === "confirmed") {
                return true;
            }

            if (appointment.status === "pending") {
                return (
                    appointment.pending_until && new Date(appointment.pending_until) > now
                );
            }

            return false;
        });

    if (activeConflict) {
        throw new AppError(
            "The selected appointment slot is no longer available",
            409,
        );
    }

    // --------------------------------------------------
    // 9. Calculate pricing
    // --------------------------------------------------

    let totalAmount;

    if (treatment.price_type === "fixed") {
        totalAmount = Number(treatment.price_min);
    } else if (treatment.price_type === "from") {
        totalAmount = Number(treatment.price_min);
    } else if (treatment.price_type === "range") {
        totalAmount = Number(treatment.price_min);
    } else {
        throw new AppError("Invalid treatment pricing configuration", 500);
    }

    const depositAmount = Number(treatment.deposit_amount || 0);
    const balanceAmount = totalAmount - depositAmount;

    if (balanceAmount < 0) {
        throw new AppError("Treatment deposit cannot exceed the total amount", 500);
    }

    // --------------------------------------------------
    // 10. Create temporary appointment hold
    // --------------------------------------------------

    const pendingUntil = new Date(Date.now() + PENDING_HOLD_MINUTES * 60 * 1000);

    const { data: appointment, error: insertError } = await supabase
        .from("appointments")
        .insert({
            patient_id: patientId,
            clinician_id: clinicianId,
            treatment_id: treatmentId,
            starts_at: startDate.toISOString(),
            ends_at: endDate.toISOString(),
            status: "pending",
            comfort_mode: comfortMode,
            total_amount: totalAmount,
            deposit_amount: depositAmount,
            balance_amount: balanceAmount,
            pending_until: pendingUntil.toISOString(),
            patient_notes: patientNotes || null,
        })
        .select(
            `
      id,
      patient_id,
      clinician_id,
      treatment_id,
      starts_at,
      ends_at,
      status,
      comfort_mode,
      total_amount,
      deposit_amount,
      balance_amount,
      pending_until,
      patient_notes,
      created_at
    `,
        )
        .single();

    if (insertError) {
        // PostgreSQL exclusion constraint catches
        // concurrent double-booking attempts.
        if (insertError.code === "23P01") {
            throw new AppError(
                "The selected appointment slot is no longer available",
                409,
            );
        }

        throw insertError;
    }

    return {
        appointment,
        patient,
        clinician,
        treatment: {
            id: treatment.id,
            name: treatment.name,
            durationMinutes: treatment.duration_minutes,
        },
    };
}

export async function getAppointments(filters = {}) {
    await expirePendingAppointments();
    const { status, clinicianId, date } = filters;

    if (status) {
        const allowedStatuses = [
            "pending",
            "confirmed",
            "cancelled",
            "completed",
            "no_show",
        ];

        if (!allowedStatuses.includes(status)) {
            throw new AppError("Invalid appointment status", 400);
        }
    }

    if (clinicianId && !isValidUuid(clinicianId)) {
        throw new AppError("Valid clinicianId is required", 400);
    }

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new AppError("Invalid date. Use YYYY-MM-DD", 400);
    }

    let query = supabase
        .from("appointments")
        .select(
            `
      id,
      starts_at,
      ends_at,
      status,
      comfort_mode,
      total_amount,
      deposit_amount,
      balance_amount,
      pending_until,
      patient_notes,
      created_at,
      updated_at,
      patient:patients (
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      clinician:clinicians (
        id,
        name,
        title,
        specialty
      ),
      treatment:treatments (
        id,
        name,
        duration_minutes,
        price_type,
        price_min,
        price_max
      )
    `,
        )
        .order("starts_at", { ascending: true });

    if (status) {
        query = query.eq("status", status);
    }

    if (clinicianId) {
        query = query.eq("clinician_id", clinicianId);
    }

    if (date) {
        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const startOfNextDay = new Date(startOfDay);

        startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1);

        query = query
            .gte("starts_at", startOfDay.toISOString())
            .lt("starts_at", startOfNextDay.toISOString());
    }

    const { data: appointments, error } = await query;

    if (error) {
        throw error;
    }

    return appointments;
}

export async function getAppointmentById(appointmentId) {
    if (!isValidUuid(appointmentId)) {
        throw new AppError("Valid appointment ID is required", 400);
    }

    await expirePendingAppointment(appointmentId);

    const { data: appointment, error } = await supabase
        .from("appointments")
        .select(
            `
      id,
      starts_at,
      ends_at,
      status,
      comfort_mode,
      total_amount,
      deposit_amount,
      balance_amount,
      pending_until,
      patient_notes,
      created_at,
      updated_at,
      patient:patients (
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      clinician:clinicians (
        id,
        name,
        title,
        specialty
      ),
      treatment:treatments (
        id,
        name,
        duration_minutes,
        price_type,
        price_min,
        price_max
      )
    `,
        )
        .eq("id", appointmentId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!appointment) {
        throw new AppError("Appointment not found", 404);
    }

    return appointment;
}

export async function getAppointmentStatus(appointmentId) {
    if (!isValidUuid(appointmentId)) {
        throw new AppError("Valid appointment ID is required", 400);
    }

    await expirePendingAppointment(appointmentId);

    const { data: appointment, error } = await supabase
        .from("appointments")
        .select(
            `
      id,
      status,
      starts_at,
      ends_at,
      pending_until
    `,
        )
        .eq("id", appointmentId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!appointment) {
        throw new AppError("Appointment not found", 404);
    }

    const pendingExpired = false;

    return {
        id: appointment.id,
        status: appointment.status,
        startsAt: appointment.starts_at,
        endsAt: appointment.ends_at,
        pendingUntil: appointment.pending_until,
        pendingExpired: Boolean(pendingExpired),
    };
}

export async function cancelAppointment(appointmentId) {
    if (!isValidUuid(appointmentId)) {
        throw new AppError("Valid appointment ID is required", 400);
    }

    const { data: appointment, error: findError } = await supabase
        .from("appointments")
        .select(
            `
      id,
      status,
      pending_until
    `,
        )
        .eq("id", appointmentId)
        .maybeSingle();

    if (findError) {
        throw findError;
    }

    if (!appointment) {
        throw new AppError("Appointment not found", 404);
    }

    if (appointment.status === "cancelled") {
        throw new AppError("Appointment is already cancelled", 400);
    }

    if (appointment.status === "completed") {
        throw new AppError("A completed appointment cannot be cancelled", 400);
    }

    if (appointment.status === "no_show") {
        throw new AppError("A no-show appointment cannot be cancelled", 400);
    }

    const { data: cancelledAppointment, error: updateError } = await supabase
        .from("appointments")
        .update({
            status: "cancelled",
            pending_until: null,
        })
        .eq("id", appointmentId)
        .select(
            `
        id,
        patient_id,
        clinician_id,
        treatment_id,
        starts_at,
        ends_at,
        status,
        comfort_mode,
        total_amount,
        deposit_amount,
        balance_amount,
        pending_until,
        patient_notes,
        created_at,
        updated_at
      `,
        )
        .single();

    if (updateError) {
        throw updateError;
    }

    return cancelledAppointment;
}