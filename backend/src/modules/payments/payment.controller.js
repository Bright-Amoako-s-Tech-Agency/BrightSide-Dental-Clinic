import {
  checkPaymentStatus,
  getPaymentById,
  handlePaymentWebhook,
  initializePayment,
} from "./payment.service.js";

import {
  normalizePaystackCallback,
  verifyPaystackSignature,
} from "./paystack.webhook.js";

export async function initializePaymentHandler(req, res) {
  const result = await initializePayment(req.body);

  return res.status(201).json({
    success: true,
    message: result.alreadyInitialized
      ? "Payment already initialized"
      : "Payment initialized successfully",
    data: result,
  });
}

export async function getPaymentHandler(req, res) {
  const payment = await getPaymentById(req.params.id);

  return res.status(200).json({
    success: true,
    data: payment,
  });
}

export async function checkPaymentStatusHandler(req, res) {
  const result = await checkPaymentStatus(req.params.id);

  return res.status(200).json({
    success: true,
    data: result,
  });
}

export async function paymentWebhookHandler(req, res) {
  // -------------------------------------------------------------------
  // Verify the request is genuinely from Paystack
  // -------------------------------------------------------------------
  //
  // Paystack signs every webhook with HMAC-SHA512 of the raw body using
  // your secret key. We verify before touching the payload.
  //
  // In development (no PAYSTACK_SECRET_KEY set) we skip verification so
  // manual test POSTs still work locally.
  // -------------------------------------------------------------------
  const signature = req.headers["x-paystack-signature"];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (
    process.env.PAYSTACK_SECRET_KEY &&
    !verifyPaystackSignature(rawBody, signature)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid webhook signature",
    });
  }

  // Normalise the Paystack payload into our standard shape.
  // Returns null for events we intentionally ignore (non-charge events).
  const normalizedPayload = normalizePaystackCallback(req.body);

  if (!normalizedPayload) {
    // Acknowledged but ignored (e.g. subscription or transfer event)
    return res.status(200).json({ success: true, message: "Event ignored" });
  }

  const result = await handlePaymentWebhook(normalizedPayload);

  return res.status(200).json({
    success: true,
    data: result,
  });
}
