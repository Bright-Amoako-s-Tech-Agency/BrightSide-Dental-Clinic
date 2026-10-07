import { Router } from "express";

import {
    checkPaymentStatusHandler,
    getPaymentHandler,
    initializePaymentHandler,
    paymentWebhookHandler,
} from "./payment.controller.js";

const router = Router();

router.post("/initialize", initializePaymentHandler);

router.get("/:id/status", checkPaymentStatusHandler);

router.get("/:id", getPaymentHandler);

router.post("/webhook", paymentWebhookHandler);

export default router;
