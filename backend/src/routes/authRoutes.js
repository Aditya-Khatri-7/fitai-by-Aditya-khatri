import express from 'express';
import { register, login, getMe, updateProfile, forgotPassword, resendResetOtp, verifyResetOtp, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/resend-otp', resendResetOtp);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

export default router;
