import { Router } from "express";

import {
    getPaymentHandler,
    initializePaymentHandler,
    paymentWebhookHandler,
} from "./payment.controller.js";

const router = Router();

router.post("/initialize", initializePaymentHandler);

router.get("/:id", getPaymentHandler);

router.post("/webhook", paymentWebhookHandler);

export default router;
