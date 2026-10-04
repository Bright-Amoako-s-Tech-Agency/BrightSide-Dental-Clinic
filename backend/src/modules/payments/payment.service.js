import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";
import { getPaymentProvider } from "./payment.provider.js";

function isValidUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

// --------------------------------------------------
// Initialize payment
// --------------------------------------------------

export async function initializePayment(data) {
  const { appointmentId, method = "momo", provider = "momo" } = data;

  if (!isValidUuid(appointmentId)) {
    throw new AppError("Valid appointmentId is required", 400);
  }

  if (!["momo", "telecel_cash", "at_money", "cash", "card"].includes(method)) {
    throw new AppError("Invalid payment method", 400);
  }

  if (provider !== "momo") {
    throw new AppError("Only MoMo is currently supported", 400);
  }

  // --------------------------------------------------
  // Find appointment
  // --------------------------------------------------

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
        phone
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

  // --------------------------------------------------
  // Appointment must still be pending
  // --------------------------------------------------

  if (appointment.status !== "pending") {
    throw new AppError(
      "Payment can only be initialized for a pending appointment",
      400,
    );
  }

  // --------------------------------------------------
  // Check pending hold
  // --------------------------------------------------

  if (
    appointment.pending_until &&
    new Date(appointment.pending_until) <= new Date()
  ) {
    throw new AppError("The appointment payment hold has expired", 409);
  }

  // --------------------------------------------------
  // Get deposit amount from appointment
  // --------------------------------------------------

  const amount = Number(appointment.deposit_amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Appointment does not have a valid deposit amount", 400);
  }

  // --------------------------------------------------
  // Check for an existing pending/successful payment
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Create payment record
  // --------------------------------------------------

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

  const providerResult = await paymentProvider.initializePayment({
    paymentId: payment.id,
    amount,
    currency: "GHS",
    phone: appointment.patient.phone,
  });

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

  const { data: payment, error: paymentError } = await supabase
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

  if (paymentError) {
    throw paymentError;
  }

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  // --------------------------------------------------
  // Verify provider
  // --------------------------------------------------

  if (payment.provider !== "momo") {
    throw new AppError("Invalid payment provider", 400);
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
      alreadyProcessed: true,
    };
  }

  // --------------------------------------------------
  // Update payment
  // --------------------------------------------------

  const updateData = {
    status: paymentStatus,
  };

  if (transactionId) {
    updateData.provider_reference = transactionId;
  }

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
      // Return the successful payment without creating another
      // appointment state transition.
      return {
        payment: updatedPayment,
        appointment: null,
        alreadyProcessed: false,
      };
    }

    return {
      payment: updatedPayment,
      appointment,
      alreadyProcessed: false,
    };
  }

  return {
    payment: updatedPayment,
    appointment: null,
    alreadyProcessed: false,
  };
}
