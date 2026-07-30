import { getCheatStatus, redeemCheat } from '../utils/cheat.js';

export async function getCheatStatusForUser(req, res) {
  try {
    res.json(getCheatStatus(req.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function redeemCheatForUser(req, res) {
  try {
    const { type, mealSlot } = req.body;
    const status = await redeemCheat(req.user, { type, mealSlot });
    await req.user.save();
    res.json(status);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
