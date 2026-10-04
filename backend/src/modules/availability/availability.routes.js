import { Router } from "express";
import { getAvailability } from "./availability.controller.js";

const router = Router();

router.get("/", getAvailability);

export default router;