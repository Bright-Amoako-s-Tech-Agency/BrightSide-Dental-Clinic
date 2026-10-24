import { Router } from "express";
import { requireStaffAuth } from "../../middleware/auth.js";
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

// Staff endpoints
router.post("/:id/complete", requireStaffAuth, completeAppointmentHandler);
router.post("/:id/no-show", requireStaffAuth, markAppointmentNoShowHandler);
router.get("/", requireStaffAuth, getAppointmentsHandler);

// Public / Patient endpoints
router.post("/", createAppointmentHandler);
router.get("/:id/status", getAppointmentStatusHandler);
router.post("/:id/cancel", cancelAppointmentHandler);
router.get("/:id", getAppointmentHandler);

export default router;
