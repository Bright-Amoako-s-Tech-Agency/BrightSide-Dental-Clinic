import { Router } from "express";

import {
    cancelAppointmentHandler,
    createAppointmentHandler,
    getAppointmentHandler,
    getAppointmentStatusHandler,
    getAppointmentsHandler,
} from "./appointment.controller.js";

const router = Router();

router.get("/", getAppointmentsHandler);

router.post("/", createAppointmentHandler);

router.get("/:id/status", getAppointmentStatusHandler);

router.post("/:id/cancel", cancelAppointmentHandler);

router.get("/:id", getAppointmentHandler);

export default router;
