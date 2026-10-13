import { Router } from "express";
import {
    createTreatmentHandler,
    getTreatmentById,
    getTreatments,
    updateTreatmentHandler,
} from "./treatment.controller.js";

const router = Router();

router.get("/", getTreatments);
router.get("/:id", getTreatmentById);

router.post("/", createTreatmentHandler);
router.patch("/:id", updateTreatmentHandler);
export default router;
