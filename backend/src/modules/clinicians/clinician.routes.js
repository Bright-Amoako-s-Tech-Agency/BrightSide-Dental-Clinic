import { Router } from "express";
import { getClinicianById, getClinicians } from "./clinician.controller.js";

const router = Router();

router.get("/", getClinicians);
router.get("/:id", getClinicianById);

export default router;
