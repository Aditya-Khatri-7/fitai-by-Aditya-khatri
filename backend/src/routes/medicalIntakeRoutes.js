import express from 'express';
import { extractHealthIntake, confirmHealthIntake } from '../controllers/medicalIntakeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/extract', extractHealthIntake);
router.post('/confirm', confirmHealthIntake);

export default router;
