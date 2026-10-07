import {
  checkPaymentStatus,
  getPaymentById,
  handlePaymentWebhook,
  initializePayment,
} from "./payment.service.js";

import { normalizeMtnCallback } from "./momo.webhook.js";

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
  const normalizedPayload = normalizeMtnCallback(req.body);

  const result = await handlePaymentWebhook(normalizedPayload);

  return res.status(200).json({
    success: true,
    data: result,
  });
}
