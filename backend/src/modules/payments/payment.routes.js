import { Router } from "express";

import {
    checkPaymentStatusHandler,
    getPaymentHandler,
    initializePaymentHandler,
    paymentWebhookHandler,
    submitPaymentOtpHandler,
} from "./payment.controller.js";

const router = Router();

router.post("/initialize", initializePaymentHandler);

router.get("/:id/status", checkPaymentStatusHandler);

router.post("/:id/otp", submitPaymentOtpHandler);

router.get("/:id", getPaymentHandler);

router.post("/webhook", paymentWebhookHandler);

export default router;
