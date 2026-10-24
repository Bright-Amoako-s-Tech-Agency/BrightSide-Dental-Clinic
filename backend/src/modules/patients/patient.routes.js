import { Router } from "express";
import { requireStaffAuth } from "../../middleware/auth.js";
import {
    createPatientHandler,
    getPatientByIdHandler,
    getPatientsHandler,
} from "./patient.controller.js";

const router = Router();

router.post("/", createPatientHandler);
router.get("/:id", getPatientByIdHandler);
router.get("/", requireStaffAuth, getPatientsHandler);

export default router;
