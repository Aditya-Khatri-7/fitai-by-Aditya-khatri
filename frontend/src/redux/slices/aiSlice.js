import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chatHistory: [
    { sender: 'ai', text: 'Hello! I am your 3D AI Adaptive Fitness Coach. I have analyzed your latest recovery and injury data. How can I help optimize your performance today?', timestamp: '09:00 AM' }
  ],
  isSpeaking: false,
  isThinking: false,
  coachMood: 'happy' // happy | thinking | energetic | warning
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    addChatMessage: (state, action) => {
      state.chatHistory.push(action.payload);
    },
    setSpeakingState: (state, action) => {
      state.isSpeaking = action.payload;
    },
    setThinkingState: (state, action) => {
      state.isThinking = action.payload;
    },
    setCoachMood: (state, action) => {
      state.coachMood = action.payload;
    }
  }
});

export const { addChatMessage, setSpeakingState, setThinkingState, setCoachMood } = aiSlice.actions;
export default aiSlice.reducer;
