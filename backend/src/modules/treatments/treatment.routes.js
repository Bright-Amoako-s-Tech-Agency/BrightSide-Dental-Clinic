import { Router } from "express";
import { requireStaffAuth } from "../../middleware/auth.js";
import {
    createTreatmentHandler,
    getTreatmentById,
    getTreatments,
    updateTreatmentHandler,
} from "./treatment.controller.js";

const router = Router();

router.get("/", getTreatments);
router.get("/:id", getTreatmentById);

router.post("/", requireStaffAuth, createTreatmentHandler);
router.patch("/:id", requireStaffAuth, updateTreatmentHandler);

export default router;
