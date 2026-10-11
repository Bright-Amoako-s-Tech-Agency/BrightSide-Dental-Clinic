import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";

const SLOT_INTERVAL_MINUTES = 45;

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function getDayOfWeek(date) {
  // Africa/Accra is UTC and has no DST.
  // Date-only values are interpreted consistently in UTC.
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
}

function dateTimeToMinutes(timestamp, date) {
  const value = new Date(timestamp);

  const startOfDay = new Date(`${date}T00:00:00Z`);

  return Math.floor((value - startOfDay) / 60000);
}

export async function findAvailability({ clinicianId, treatmentId, date }) {
  if (!clinicianId || !treatmentId || !date) {
    throw new AppError("clinicianId, treatmentId and date are required", 400);
  }

  if (!isValidDate(date)) {
    throw new AppError("date must be in YYYY-MM-DD format", 400);
  }

  const dayOfWeek = getDayOfWeek(date);

  // --------------------------------------------------
  // 1. Confirm clinician exists and is active
  // --------------------------------------------------

  const { data: clinician, error: clinicianError } = await supabase
    .from("clinicians")
    .select("id, name, active")
    .eq("id", clinicianId)
    .eq("active", true)
    .maybeSingle();

  if (clinicianError) {
    throw new AppError("Failed to fetch clinician", 500);
  }

  if (!clinician) {
    throw new AppError("Clinician not found", 404);
  }

  // --------------------------------------------------
  // 2. Get treatment and its duration
  // --------------------------------------------------

  const { data: treatment, error: treatmentError } = await supabase
    .from("treatments")
    .select("id, name, duration_minutes, active")
    .eq("id", treatmentId)
    .eq("active", true)
    .maybeSingle();

  if (treatmentError) {
    throw new AppError("Failed to fetch treatment", 500);
  }

  if (!treatment) {
    throw new AppError("Treatment not found", 404);
  }

  // --------------------------------------------------
  // 3. Confirm clinician can perform treatment
  // --------------------------------------------------

  const { data: clinicianTreatment, error: mappingError } = await supabase
    .from("clinician_treatments")
    .select("clinician_id, treatment_id")
    .eq("clinician_id", clinicianId)
    .eq("treatment_id", treatmentId)
    .maybeSingle();

  if (mappingError) {
    throw new AppError("Failed to verify clinician treatment", 500);
  }

  if (!clinicianTreatment) {
    throw new AppError("Clinician does not provide this treatment", 400);
  }

  // --------------------------------------------------
  // 4. Get recurring availability for this weekday
  // --------------------------------------------------

  const { data: schedules, error: scheduleError } = await supabase
    .from("clinician_availability")
    .select(
      `
      id,
      day_of_week,
      start_time,
      end_time,
      active
    `,
    )
    .eq("clinician_id", clinicianId)
    .eq("day_of_week", dayOfWeek)
    .eq("active", true)
    .order("start_time", { ascending: true });

  if (scheduleError) {
    throw new AppError("Failed to fetch clinician availability", 500);
  }

  if (!schedules.length) {
    return {
      date,
      clinician,
      treatment: {
        id: treatment.id,
        name: treatment.name,
        durationMinutes: treatment.duration_minutes,
      },
      slots: [],
    };
  }

  // --------------------------------------------------
  // 5. Get clinician time-off for this date
  // --------------------------------------------------

  const dayStart = `${date}T00:00:00.000Z`;
  const nextDate = new Date(`${date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const nextDay = nextDate.toISOString();

  const { data: timeOff, error: timeOffError } = await supabase
    .from("clinician_time_off")
    .select(
      `
      id,
      starts_at,
      ends_at,
      reason
    `,
    )
    .eq("clinician_id", clinicianId)
    .lt("starts_at", nextDay)
    .gt("ends_at", dayStart);

  if (timeOffError) {
    throw new AppError("Failed to fetch clinician time off", 500);
  }

  // --------------------------------------------------
  // 6. Get existing appointments for this date
  // --------------------------------------------------

  const { data: appointments, error: appointmentError } = await supabase
    .from("appointments")
    .select(
      `
        id,
        starts_at,
        ends_at,
        status,
        pending_until
      `,
    )
    .eq("clinician_id", clinicianId)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", nextDay)
    .gt("ends_at", dayStart);

  if (appointmentError) {
    throw new AppError("Failed to fetch existing appointments", 500);
  }

  const now = new Date();

  // Expired pending holds should not be treated as unavailable
  // by the availability calculation.
  const activeAppointments = appointments.filter((appointment) => {
    if (appointment.status === "confirmed") {
      return true;
    }

    if (!appointment.pending_until) {
      return true;
    }

    return new Date(appointment.pending_until) > now;
  });

  // --------------------------------------------------
  // 7. Generate 45-minute interval slots
  // --------------------------------------------------

  const slots = [];

  for (const schedule of schedules) {
    const scheduleStart = timeToMinutes(schedule.start_time);
    const scheduleEnd = timeToMinutes(schedule.end_time);

    for (
      let startMinutes = scheduleStart;
      startMinutes + treatment.duration_minutes <= scheduleEnd;
      startMinutes += SLOT_INTERVAL_MINUTES
    ) {
      const endMinutes = startMinutes + treatment.duration_minutes;

      const startsAt = `${date}T${minutesToTime(startMinutes)}Z`;
      const endsAt = `${date}T${minutesToTime(endMinutes)}Z`;

      const start = new Date(startsAt);
      const end = new Date(endsAt);

      // ------------------------------------------------
      // Don't offer slots that are already in the past
      // ------------------------------------------------

      if (start <= now) {
        continue;
      }

      // ------------------------------------------------
      // Check time-off conflicts
      // ------------------------------------------------

      const conflictsWithTimeOff = timeOff.some((period) => {
        const periodStart = new Date(period.starts_at);
        const periodEnd = new Date(period.ends_at);

        return start < periodEnd && end > periodStart;
      });

      if (conflictsWithTimeOff) {
        continue;
      }

      // ------------------------------------------------
      // Check appointment conflicts
      // ------------------------------------------------

      const conflictsWithAppointment = activeAppointments.some(
        (appointment) => {
          const appointmentStart = new Date(appointment.starts_at);

          const appointmentEnd = new Date(appointment.ends_at);

          return start < appointmentEnd && end > appointmentStart;
        },
      );

      if (conflictsWithAppointment) {
        continue;
      }

      slots.push({
        startsAt,
        endsAt,
        durationMinutes: treatment.duration_minutes,
      });
    }
  }

  return {
    date,
    clinician,
    treatment: {
      id: treatment.id,
      name: treatment.name,
      durationMinutes: treatment.duration_minutes,
    },
    slots,
  };
}

export async function findClinicianSchedule(clinicianId) {
  if (
    typeof clinicianId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      clinicianId,
    )
  ) {
    throw new AppError("Valid clinicianId is required", 400);
  }

  const { data: clinician, error: clinicianError } = await supabase
    .from("clinicians")
    .select("id, name, active")
    .eq("id", clinicianId)
    .eq("active", true)
    .maybeSingle();

  if (clinicianError) {
    throw new AppError("Failed to fetch clinician", 500);
  }

  if (!clinician) {
    throw new AppError("Clinician not found", 404);
  }

  const { data: availability, error: availabilityError } = await supabase
    .from("clinician_availability")
    .select("id, day_of_week, start_time, end_time, active")
    .eq("clinician_id", clinicianId)
    .eq("active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (availabilityError) {
    throw new AppError("Failed to fetch clinician schedule", 500);
  }

  const now = new Date().toISOString();

  const { data: timeOff, error: timeOffError } = await supabase
    .from("clinician_time_off")
    .select("id, starts_at, ends_at, reason")
    .eq("clinician_id", clinicianId)
    .gte("ends_at", now)
    .order("starts_at", { ascending: true });

  if (timeOffError) {
    throw new AppError("Failed to fetch clinician time off", 500);
  }

  return {
    clinician,
    availability,
    timeOff,
  };
}
