import { Router } from "express";
import {
    createPatientHandler,
    getPatientByIdHandler,
    getPatientsHandler,
} from "./patient.controller.js";

const router = Router();

router.post("/", createPatientHandler);
router.get("/:id", getPatientByIdHandler);
router.get("/", getPatientsHandler);

export default router;
