import {
    getPaymentById,
    handlePaymentWebhook,
    initializePayment,
} from "./payment.service.js";

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

export async function paymentWebhookHandler(req, res) {
  const result = await handlePaymentWebhook(req.body);

  return res.status(200).json({
    success: true,
    message: result.alreadyProcessed
      ? "Payment webhook already processed"
      : "Payment webhook processed successfully",
    data: result,
  });
}
