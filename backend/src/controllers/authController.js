import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function stripPassword(userDoc) {
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete obj.password;
  return obj;
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: stripPassword(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMe(req, res) {
  res.json(req.user);
}

const EDITABLE_PROFILE_FIELDS = ['age', 'gender', 'height', 'weight', 'bodyFatPercentage', 'fitnessLevel', 'activityLevel'];
const EDITABLE_PREFERENCE_FIELDS = ['workoutDuration', 'workoutLocation', 'dietType', 'budget', 'cookingSkill', 'country', 'religion'];
const EDITABLE_GOAL_FIELDS = ['type', 'targetValue', 'startValue', 'unit', 'startDate', 'deadline'];

export async function updateProfile(req, res) {
  try {
    const { name, avatar, equipment, profile, preferences, currentGoal, healthProfile, injuries, onboardingCompleted } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (Array.isArray(equipment)) user.equipment = equipment;
    if (Array.isArray(injuries)) user.injuries = injuries;
    if (onboardingCompleted !== undefined) user.onboardingCompleted = onboardingCompleted;

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
