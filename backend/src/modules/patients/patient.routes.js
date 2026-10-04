import { Router } from 'express';
import { createPatientHandler } from './patient.controller.js';

const router = Router();

router.post('/', createPatientHandler);

export default router;