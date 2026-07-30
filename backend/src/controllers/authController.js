import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function stripPassword(userDoc) {
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete obj.password;
  delete obj.passwordResetOtpHash;
  delete obj.passwordResetOtpExpiry;
  return obj;
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function issueResetOtp(email) {
  const user = await User.findOne({ email });
  if (!user) return; // don't reveal whether the email exists
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.passwordResetOtpHash = await bcrypt.hash(otp, 10);
  user.passwordResetOtpExpiry = new Date(Date.now() + OTP_TTL_MS);
  await user.save();
  // No email service is wired up yet — this is the local-dev substitute for an
  // actual email send, so the flow is genuinely testable rather than a 404.
  console.log(`[Password Reset] OTP for ${email}: ${otp} (expires in 10 min)`);
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: stripPassword(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: stripPassword(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMe(req, res) {
  res.json(req.user);
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    await issueResetOtp(email);
    // Same generic response whether or not the account exists, to avoid
    // leaking which emails are registered.
    res.json({ message: 'If that email is registered, a reset OTP has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function resendResetOtp(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    await issueResetOtp(email);
    res.json({ message: 'If that email is registered, a new reset OTP has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function checkResetOtp(email, otp) {
  const user = await User.findOne({ email });
  if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiry) {
    return { ok: false, message: 'Invalid or expired OTP.' };
  }
  if (user.passwordResetOtpExpiry.getTime() < Date.now()) {
    return { ok: false, message: 'This OTP has expired — request a new one.' };
  }
  const matches = await bcrypt.compare(String(otp), user.passwordResetOtpHash);
  if (!matches) return { ok: false, message: 'Incorrect OTP code.' };
  return { ok: true, user };
}

export async function verifyResetOtp(req, res) {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });
    const result = await checkResetOtp(email, otp);
    if (!result.ok) return res.status(400).json({ message: result.message });
    res.json({ message: 'OTP verified.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }
    const result = await checkResetOtp(email, otp);
    if (!result.ok) return res.status(400).json({ message: result.message });

    result.user.password = await bcrypt.hash(newPassword, 10);
    result.user.passwordResetOtpHash = undefined;
    result.user.passwordResetOtpExpiry = undefined;
    await result.user.save();

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const EDITABLE_PROFILE_FIELDS = ['age', 'gender', 'height', 'weight', 'bodyFatPercentage', 'fitnessLevel', 'activityLevel'];
const EDITABLE_PREFERENCE_FIELDS = ['workoutDuration', 'workoutLocation', 'dietType', 'budget', 'cookingSkill', 'country', 'religion', 'cuisine', 'cuisinePerMeal'];
const EDITABLE_GOAL_FIELDS = ['type', 'targetValue', 'startValue', 'unit', 'startDate', 'deadline'];

export async function updateProfile(req, res) {
  try {
    const { name, avatar, equipment, profile, preferences, currentGoal, healthProfile, injuries, onboardingCompleted, community } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (Array.isArray(equipment)) user.equipment = equipment;
    if (Array.isArray(injuries)) user.injuries = injuries;
    if (onboardingCompleted !== undefined) user.onboardingCompleted = onboardingCompleted;

    if (community && typeof community === 'object') {
      user.community = user.community || {};
      if (community.joined !== undefined) {
        user.community.joined = community.joined;
        user.community.joinedAt = community.joined ? new Date() : user.community.joinedAt;
      }
    }

    if (profile && typeof profile === 'object') {
      for (const field of EDITABLE_PROFILE_FIELDS) {
        if (profile[field] !== undefined) user.profile[field] = profile[field];
      }
    }

    if (preferences && typeof preferences === 'object') {
      for (const field of EDITABLE_PREFERENCE_FIELDS) {
        if (preferences[field] !== undefined) user.preferences[field] = preferences[field];
      }
      if (Array.isArray(preferences.cheatDays)) user.preferences.cheatDays = preferences.cheatDays;
    }

    if (currentGoal && typeof currentGoal === 'object') {
      user.currentGoal = user.currentGoal || {};
      for (const field of EDITABLE_GOAL_FIELDS) {
        if (currentGoal[field] !== undefined) user.currentGoal[field] = currentGoal[field];
      }
    }

    if (healthProfile && typeof healthProfile === 'object') {
      if (Array.isArray(healthProfile.allergies)) user.healthProfile.allergies = healthProfile.allergies;
      if (healthProfile.bloodType !== undefined) user.healthProfile.bloodType = healthProfile.bloodType;
      if (Array.isArray(healthProfile.chronicConditions)) user.healthProfile.chronicConditions = healthProfile.chronicConditions;
    }

    await user.save();
    res.json(stripPassword(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
