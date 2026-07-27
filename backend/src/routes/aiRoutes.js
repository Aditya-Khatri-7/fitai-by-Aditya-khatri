import express from 'express';
import { chat, coachAction } from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', chat);
router.post('/coach-action', coachAction);

export default router;
