import { Router } from "express";

import {
    cancelAppointmentHandler,
    completeAppointmentHandler,
    createAppointmentHandler,
    getAppointmentHandler,
    getAppointmentStatusHandler,
    getAppointmentsHandler,
    markAppointmentNoShowHandler,
} from "./appointment.controller.js";

const router = Router();
router.post("/:id/complete", completeAppointmentHandler);
router.post("/:id/no-show", markAppointmentNoShowHandler);
router.get("/", getAppointmentsHandler);

router.post("/", createAppointmentHandler);

router.get("/:id/status", getAppointmentStatusHandler);

router.post("/:id/cancel", cancelAppointmentHandler);

router.get("/:id", getAppointmentHandler);

export default router;
