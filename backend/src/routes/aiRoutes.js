import express from 'express';
import { chat, coachAction } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/chat', chat);
router.post('/coach-action', coachAction);

export default router;
