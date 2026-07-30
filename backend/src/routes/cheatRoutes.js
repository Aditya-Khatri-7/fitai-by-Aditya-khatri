import express from 'express';
import { getCheatStatusForUser, redeemCheatForUser } from '../controllers/cheatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/status', getCheatStatusForUser);
router.post('/redeem', redeemCheatForUser);

export default router;
