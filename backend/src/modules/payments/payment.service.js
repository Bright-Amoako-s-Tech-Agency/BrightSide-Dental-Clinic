import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";
import { sendAppointmentConfirmationEmail } from "../../utils/email.js";
import { getPaymentProvider } from "./payment.provider.js";

function isValidUuid(value) {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value,
        )
    );
}

// Initialize payment

export async function initializePayment(data) {
    const { appointmentId, method = "paystack", provider = "paystack" } = data;

    if (!isValidUuid(appointmentId)) {
        throw new AppError("Valid appointmentId is required", 400);
    }

    const SUPPORTED_PROVIDERS = ["paystack"];

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
        throw new AppError(
            `Unsupported payment provider: "${provider}". Supported: ${SUPPORTED_PROVIDERS.join(", ")}`,
            400,
        );
    }

    // Find appointment

    const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .select(
            `
      id,
      patient_id,
      status,
      deposit_amount,
      pending_until,
      starts_at,
      ends_at,
      patient:patients (
        id,
        first_name,
        last_name,
        phone,
        email
      )
    `,
        )
        .eq("id", appointmentId)
        .maybeSingle();

    if (appointmentError) {
        throw appointmentError;
    }

    if (!appointment) {
        throw new AppError("Appointment not found", 404);
    }

    // Appointment must still be pending

    if (appointment.status !== "pending") {
        throw new AppError(
            "Payment can only be initialized for a pending appointment",
            400,
        );
    }

    // Check pending hold

    if (
        appointment.pending_until &&
        new Date(appointment.pending_until) <= new Date()
    ) {
        const { error: expireError } = await supabase
            .from("appointments")
            .update({
                status: "cancelled",
                pending_until: null,
            })
            .eq("id", appointmentId)
            .eq("status", "pending");

        if (expireError) {
            throw expireError;
        }

        throw new AppError("The appointment payment hold has expired", 409);
    }

    // Get deposit amount from appointment

    const amount = Number(appointment.deposit_amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError("Appointment does not have a valid deposit amount", 400);
    }

    // Check for an existing pending/successful payment

    const { data: existingPayments, error: existingError } = await supabase
        .from("payments")
        .select(
            `
      id,
      amount,
      currency,
      method,
      provider,
      status,
      provider_reference,
      created_at
    `,
        )
        .eq("appointment_id", appointmentId)
        .in("status", ["pending", "successful"])
        .order("created_at", { ascending: false })
        .limit(1);

    if (existingError) {
        throw existingError;
    }

    const existingPayment = existingPayments && existingPayments[0];

    if (existingPayment) {
        return {
            payment: existingPayment,
            alreadyInitialized: true,
        };
    }

    // Create payment record

    const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
            appointment_id: appointmentId,
            amount,
            currency: "GHS",
            method,
            provider,
            status: "pending",
        })
        .select(
            `
  id,
  appointment_id,
  amount,
  currency,
  method,
  provider,
  status,
  provider_reference,
  created_at,
  paid_at
`,
        )
        .single();

    if (paymentError) {
        throw paymentError;
    }

    // --------------------------------------------------
    // Initialize external provider
    // --------------------------------------------------

    const paymentProvider = getPaymentProvider(provider);

    let providerResult;

    try {
        providerResult = await paymentProvider.initializePayment({
            paymentId: payment.id,
            amount,
            currency: "GHS",
            phone: appointment.patient.phone,
            email: appointment.patient.email || null,
        });
    } catch (error) {
        // The payment was created locally, but the external
        // provider did not accept the payment request.
        //
        // Mark it as failed so a later attempt can create a
        // fresh payment initialization.

        const { error: paymentUpdateError } = await supabase
            .from("payments")
            .update({
                status: "failed",
            })
            .eq("id", payment.id);

        if (paymentUpdateError) {
            throw paymentUpdateError;
        }

        throw error;
    }

    if (!providerResult || !providerResult.providerReference) {
        const { error: paymentUpdateError } = await supabase
            .from("payments")
            .update({ status: "failed" })
            .eq("id", payment.id);

        if (paymentUpdateError) {
            throw paymentUpdateError;
        }

        throw new AppError(
            "Payment provider did not return a provider reference",
            502,
        );
    }

    // --------------------------------------------------
    // Store provider reference
    // --------------------------------------------------

    let updatedPayment = payment;

    if (providerResult.providerReference) {
        const { data: savedPayment, error: updateError } = await supabase
            .from("payments")
            .update({
                provider_reference: providerResult.providerReference,
            })
            .eq("id", payment.id)
            .select(
                `
  id,
  appointment_id,
  amount,
  currency,
  method,
  provider,
  status,
  provider_reference,
  created_at,
  paid_at
`,
            )
            .single();

        if (updateError) {
            throw updateError;
        }

        updatedPayment = savedPayment;
    }

    return {
        payment: updatedPayment,
        provider: providerResult,
        alreadyInitialized: false,
    };
}

// --------------------------------------------------
// Get payment
// --------------------------------------------------

export async function getPaymentById(paymentId) {
    if (!isValidUuid(paymentId)) {
        throw new AppError("Valid payment ID is required", 400);
    }

    const { data: payment, error } = await supabase
        .from("payments")
        .select(
            `
  id,
  appointment_id,
  amount,
  currency,
  method,
  provider,
  status,
  provider_reference,
  created_at,
  paid_at
`,
        )
        .eq("id", paymentId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!payment) {
        throw new AppError("Payment not found", 404);
    }

    return payment;
}

export async function handlePaymentWebhook(data) {
    const { referenceId, status, amount, transactionId } = data;

    if (!referenceId) {
        throw new AppError("referenceId is required", 400);
    }

    if (!status) {
        throw new AppError("Payment status is required", 400);
    }

    const normalizedStatus = String(status).toLowerCase();

    const statusMap = {
        successful: "successful",
        success: "successful",
        failed: "failed",
        cancelled: "cancelled",
        canceled: "cancelled",
        timeout: "failed",
        pending: "pending",
    };

    const paymentStatus = statusMap[normalizedStatus];

    if (!paymentStatus) {
        throw new AppError(`Unsupported payment status: ${status}`, 400);
    }

    // --------------------------------------------------
    // Find payment
    // --------------------------------------------------
    //
    // For real MTN callbacks:
    //
    // MTN externalId = our payment.id
    //
    // We also keep provider_reference lookup for
    // backwards compatibility with our manual webhook tests.
    // --------------------------------------------------

    let payment = null;

    const { data: paymentById, error: paymentByIdError } = await supabase
        .from("payments")
        .select(
            `
      id,
      appointment_id,
      amount,
      currency,
      method,
      provider,
      status,
      provider_reference
    `,
        )
        .eq("id", referenceId)
        .maybeSingle();

    if (paymentByIdError) {
        throw paymentByIdError;
    }

    payment = paymentById;

    // --------------------------------------------------
    // Fallback: find by provider reference
    // --------------------------------------------------

    if (!payment) {
        const { data: paymentByReference, error: paymentReferenceError } =
        await supabase
            .from("payments")
            .select(
                `
        id,
        appointment_id,
        amount,
        currency,
        method,
        provider,
        status,
        provider_reference
      `,
            )
            .eq("provider_reference", referenceId)
            .maybeSingle();

        if (paymentReferenceError) {
            throw paymentReferenceError;
        }

        payment = paymentByReference;
    }

    if (!payment) {
        throw new AppError("Payment not found", 404);
    }

    // --------------------------------------------------
    // Verify provider
    // --------------------------------------------------

    const SUPPORTED_PROVIDERS = ["paystack"];

    if (!SUPPORTED_PROVIDERS.includes(payment.provider)) {
        throw new AppError(
            `Invalid payment provider: "${payment.provider}"`,
            400,
        );
    }

    // --------------------------------------------------
    // Verify amount when supplied
    // --------------------------------------------------

    if (amount !== undefined && amount !== null) {
        const webhookAmount = Number(amount);
        const paymentAmount = Number(payment.amount);

        if (!Number.isFinite(webhookAmount) || webhookAmount !== paymentAmount) {
            throw new AppError("Payment amount mismatch", 400);
        }
    }

    // --------------------------------------------------
    // Idempotency
    // --------------------------------------------------

    if (payment.status === "successful") {
        return {
            payment,
            appointment: null,
            alreadyProcessed: true,
        };
    }

    // --------------------------------------------------
    // Update payment
    // --------------------------------------------------

    const updateData = {
        status: paymentStatus,
    };

    if (paymentStatus === "successful") {
        updateData.paid_at = new Date().toISOString();
    }

    /*
     * IMPORTANT:
     *
     * Do NOT replace provider_reference with MTN's
     * financialTransactionId.
     *
     * provider_reference contains the MTN X-Reference-Id
     * generated during RequestToPay.
     *
     * transactionId is still available to the caller if
     * needed, but our current payments schema has no
     * dedicated transaction_id column.
     */

    const { data: updatedPayment, error: updatePaymentError } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", payment.id)
        .select(
            `
        id,
        appointment_id,
        amount,
        currency,
        method,
        provider,
        status,
        provider_reference,
        created_at
      `,
        )
        .single();

    if (updatePaymentError) {
        throw updatePaymentError;
    }

    // --------------------------------------------------
    // Successful payment → confirm appointment
    // --------------------------------------------------

    if (paymentStatus === "successful") {
        const { data: appointment, error: appointmentError } = await supabase
            .from("appointments")
            .update({
                status: "confirmed",
                pending_until: null,
            })
            .eq("id", payment.appointment_id)
            .eq("status", "pending")
            .gt("pending_until", new Date().toISOString())
            .select(
                `
          id,
          status,
          starts_at,
          ends_at,
          total_amount,
          deposit_amount,
          balance_amount
        `,
            )
            .maybeSingle();

        if (appointmentError) {
            throw appointmentError;
        }

        if (!appointment) {
            // Payment succeeded but appointment was no longer pending.
            return {
                payment: updatedPayment,
                appointment: null,
                alreadyProcessed: false,
            };
        }

        // Asynchronously send email confirmation if patient has email
        (async () => {
            try {
                const { data: fullAppt } = await supabase
                    .from("appointments")
                    .select(`
                        id,
                        starts_at,
                        ends_at,
                        total_amount,
                        deposit_amount,
                        balance_amount,
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
                            title
                        ),
                        treatment:treatments (
                            id,
                            name,
                            duration_minutes
                        )
                    `)
                    .eq("id", appointment.id)
                    .maybeSingle();

                if (fullAppt?.patient) {
                    await sendAppointmentConfirmationEmail({
                        patient: fullAppt.patient,
                        appointment: fullAppt,
                        clinician: fullAppt.clinician,
                        treatment: fullAppt.treatment,
                    });
                }
            } catch (err) {
                console.error("[Email] Error dispatching confirmation email:", err);
            }
        })();

        return {
            payment: updatedPayment,
            appointment,
            transactionId: transactionId || null,
            alreadyProcessed: false,
        };
    }

    return {
        payment: updatedPayment,
        appointment: null,
        transactionId: transactionId || null,
        alreadyProcessed: false,
    };
}

export async function checkPaymentStatus(paymentId) {
    if (!isValidUuid(paymentId)) {
        throw new AppError("Valid payment ID is required", 400);
    }

    const { data: payment, error } = await supabase
        .from("payments")
        .select(
            `
      id,
      appointment_id,
      amount,
      currency,
      method,
      provider,
      status,
      provider_reference,
      created_at,
      paid_at
      `,
        )
        .eq("id", paymentId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!payment) {
        throw new AppError("Payment not found", 404);
    }

    const SUPPORTED_PROVIDERS = ["paystack"];

    if (!SUPPORTED_PROVIDERS.includes(payment.provider)) {
        throw new AppError(
            `Invalid payment provider: "${payment.provider}"`,
            400,
        );
    }

    if (!payment.provider_reference) {
        throw new AppError("Payment does not have a provider reference", 409);
    }

    const paymentProvider = getPaymentProvider(payment.provider);

    const providerResult = await paymentProvider.getPaymentStatus(
        payment.provider_reference,
    );

    const normalizedStatus = String(providerResult.status || "").toLowerCase();

    const result = await handlePaymentWebhook({
        referenceId: payment.id,
        status: normalizedStatus,
        amount: providerResult.amount,
        transactionId: providerResult.financialTransactionId || null,
    });

    return {
        ...result,
        provider: providerResult,
    };
}