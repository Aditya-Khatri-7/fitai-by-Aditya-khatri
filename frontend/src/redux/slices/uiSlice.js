import { createSlice } from '@reduxjs/toolkit';

// Starts collapsed on a real narrow viewport (an actual phone) so the drawer isn't
// covering the whole screen on first load — desktop keeps its existing default-open.
const initialState = {
  isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  isCommandPaletteOpen: false,
  isWearableModalOpen: false,
  isAISwapModalOpen: false,
  selectedExerciseForSwap: null,
  activeTab: 'dashboard',
  isHelpCenterOpen: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setCommandPaletteOpen: (state, action) => {
      state.isCommandPaletteOpen = action.payload;
    },
    setWearableModalOpen: (state, action) => {
      state.isWearableModalOpen = action.payload;
    },
    setAISwapModalOpen: (state, action) => {
      state.isAISwapModalOpen = action.payload.isOpen;
      state.selectedExerciseForSwap = action.payload.exercise || null;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setHelpCenterOpen: (state, action) => {
      state.isHelpCenterOpen = action.payload;
    }
  }
});

export const {
  toggleSidebar,
  setCommandPaletteOpen,
  setWearableModalOpen,
  setAISwapModalOpen,
  setActiveTab,
  setHelpCenterOpen
} = uiSlice.actions;

export default uiSlice.reducer;
