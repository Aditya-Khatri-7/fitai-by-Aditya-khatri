import express from 'express';
import { syncWearableData } from '../controllers/wearableController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/sync', syncWearableData);

export default router;
