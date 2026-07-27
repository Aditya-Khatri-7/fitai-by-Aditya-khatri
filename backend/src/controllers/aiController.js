import { chatWithAICoach, resolveCoachAction } from '../services/aiService.js';

export async function chat(req, res) {
  try {
    const { message, userContext } = req.body;
    const response = await chatWithAICoach(message, userContext || {});
    res.json({ reply: response });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function coachAction(req, res) {
  try {
    const { message, history, appState } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }
    const result = await resolveCoachAction(message, { history, appState });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      replyText: "Something went wrong processing that request, so nothing was changed.",
      proposedAction: null,
      degraded: true
    });
  }
}
