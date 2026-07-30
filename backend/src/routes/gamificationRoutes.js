import express from 'express';
import {
  getGamificationState, addXpToUser, completeQuestForUser, setArchetypeForUser, addPRRecordForUser
} from '../controllers/gamificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getGamificationState);
router.post('/xp', addXpToUser);
router.post('/quests/:questId/complete', completeQuestForUser);
router.post('/archetype', setArchetypeForUser);
router.post('/pr-records', addPRRecordForUser);

export default router;
