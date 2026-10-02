import { Router } from "express";
import { getTreatmentById, getTreatments } from "./treatment.controller.js";

const router = Router();

router.get("/", getTreatments);
router.get("/:id", getTreatmentById);

export default router;
