import { Router } from "express";
import { requireStaffAuth } from "../../middleware/auth.js";
import {
    createClinicianHandler,
    getClinicianById,
    getClinicians,
} from "./clinician.controller.js";

const router = Router();

router.get("/", getClinicians);
router.post("/", requireStaffAuth, createClinicianHandler);
router.get("/:id", getClinicianById);

export default router;
