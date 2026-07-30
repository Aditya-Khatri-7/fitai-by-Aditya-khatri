import express from 'express';
import { processHealthUpdate, getHealthSnapshot, getHealthMetricRange } from '../controllers/healthUpdateController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/update', processHealthUpdate);
router.get('/snapshot', getHealthSnapshot);
router.get('/metrics', getHealthMetricRange);

export default router;
