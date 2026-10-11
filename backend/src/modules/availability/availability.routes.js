import { Router } from "express";
import {
    getAvailability,
    getClinicianSchedule,
} from "./availability.controller.js";

const router = Router();

router.get("/", getAvailability);
router.get("/clinicians/:clinicianId/schedule", getClinicianSchedule);
export default router;
