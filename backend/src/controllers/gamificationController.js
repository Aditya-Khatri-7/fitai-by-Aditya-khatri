import { ensureDailyQuestsFresh, applyXp, completeQuest, setArchetype, addPRRecord } from '../utils/gamification.js';

export async function getGamificationState(req, res) {
  try {
    ensureDailyQuestsFresh(req.user);
    await req.user.save();
    res.json(req.user.gamification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function addXpToUser(req, res) {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'A positive numeric "amount" is required.' });
    }
    applyXp(req.user, amount);
    await req.user.save();
    res.json(req.user.gamification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function completeQuestForUser(req, res) {
  try {
    completeQuest(req.user, req.params.questId);
    await req.user.save();
    res.json(req.user.gamification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function setArchetypeForUser(req, res) {
  try {
    setArchetype(req.user, req.body.archetype);
    await req.user.save();
    res.json(req.user.gamification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function addPRRecordForUser(req, res) {
  try {
    addPRRecord(req.user, req.body.record);
    await req.user.save();
    res.json(req.user.gamification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
