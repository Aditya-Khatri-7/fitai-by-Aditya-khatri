import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setWearableModalOpen } from '../redux/slices/uiSlice';
import { removeSnacksFromMealPlan, updateSpecificMeal, updateMultipleMeals, regenerateSingleMealRemote } from '../redux/slices/nutritionSlice';
import { reshuffleWorkout, swapExercise, createMergedWorkoutPlan, generateWorkout, persistWorkoutEdit } from '../redux/slices/workoutSlice';
import { store } from '../redux/store';
import { useTheme } from './ThemeContext';
import { useSpeech } from '../hooks/useSpeech';
import { resolveCoachAction, buildAppStateSnapshot } from '../services/coachActionService';
import { SpatialCoachContext } from './spatialCoachContextObject';
import toast from 'react-hot-toast';

export function SpatialCoachProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { theme, setTheme, isThemeSwitcherOpen, setIsThemeSwitcherOpen } = useTheme();
  const { speak: speakUtterance } = useSpeech();
  const nutrition = useSelector(state => state.nutrition);
  const workout = useSelector(state => state.workout);

  // Mode: 'docked' | 'chat' | 'spatial'
  const [coachMode, setCoachMode] = useState('docked');
  const [speechText, setSpeechText] = useState("Hi! I am your persistent 3D AI Coach. How is your body feeling today?");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gestureTrigger, setGestureTrigger] = useState(null);

  // Intent Confirmation Card State
  const [navConfirmation, setNavConfirmation] = useState(null);

  // Conversation Persistence
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hi! I am your persistent 3D AI Coach. How is your body feeling today?" }
  ]);

  const speechTimerRef = useRef(null);

  // Speech Output Helper with voice synthesis
  const speak = (text) => {
    setSpeechText(text);
    setIsSpeaking(true);

    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);

    if (!isMuted) {
      const utterance = speakUtterance(text);
      if (utterance) {
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
      }
    }

    speechTimerRef.current = setTimeout(() => {
      setIsSpeaking(false);
    }, Math.max(4000, text.length * 65));
  };

  const stepIn = () => {
    setCoachMode('docked');
    speak("Stepping back inside the window portal!");
  };

  const stepOut = () => {
    setCoachMode('spatial');
    speak("I am climbing out of the window to guide your performance spatial style!");
  };

  const triggerGesture = (type) => {
    setGestureTrigger(type);
    if (type === 'wave') {
      speak("Hey there! I'm your persistent global AI assistant.");
    } else if (type === 'high_five') {
      speak("High five! Let's keep that streak alive!");
    }
    setTimeout(() => setGestureTrigger(null), 3000);
  };

  useEffect(() => {
    if (isThemeSwitcherOpen) {
      setCoachMode('docked');
    }
  }, [isThemeSwitcherOpen]);

  useEffect(() => {
    setCoachMode('docked');
    setNavConfirmation(null);
  }, [location.pathname]);

  // Execute Confirmed Proposed Action
  const executeProposedAction = (action) => {
    if (!action) return;

    if (action.type === 'UPDATE_MULTIPLE_MEALS') {
      dispatch(updateMultipleMeals(action.payload));
      toast.success("🥗 Multi-meal updates applied to system!");
    } else if (action.type === 'MERGE_WORKOUT_PLANS') {
      dispatch(createMergedWorkoutPlan(action.payload));
      toast.success(`🏋️ Merged workout plan created! Updated in system.`);
    } else if (action.type === 'UPDATE_CUSTOM_MEAL') {
      dispatch(updateSpecificMeal(action.payload));
      toast.success(`🥗 Meal updated to ${action.payload.name}!`);
    } else if (action.type === 'SWAP_BREAKFAST' || action.type === 'SWAP_DINNER_VEG' || action.type === 'ADD_SNACKS') {
      // Routed through the real backend regenerator (real Indian-diet-aware templates
      // respecting the user's actual dietType) instead of the old hardcoded Western
      // dish fixtures, which never persisted and ignored the user's real diet profile.
      const mealType = action.type === 'SWAP_DINNER_VEG' ? 'dinner' : action.type === 'ADD_SNACKS' ? 'snack' : 'breakfast';
      const mealPlanId = nutrition.todayMealPlan?._id;
      if (mealPlanId) {
        dispatch(regenerateSingleMealRemote({
          mealPlanId,
          mealType,
          dietTypeOverride: action.type === 'SWAP_DINNER_VEG' ? 'vegetarian' : undefined
        }));
        toast.success(`🥗 ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} swapped — matched to your real diet profile!`);
      } else {
        toast.error('Generate a meal plan first.');
      }
    } else if (action.type === 'REMOVE_SNACKS') {
      dispatch(removeSnacksFromMealPlan());
      toast.success("🥗 Snacks removed from Nutrition Plan!");
    } else if (action.type === 'SWITCH_WORKOUT') {
      const SPLIT_FOCUS_GROUPS = {
        hypertrophy_upper: { focusGroups: [['Chest', 'Shoulders'], ['Triceps']], title: 'Hypertrophy Upper Body & Core', splitFocus: 'Chest, Shoulders & Triceps' },
        power_pull: { focusGroups: [['Back', 'Lats'], ['Biceps']], title: 'Power Pull & Back Specialization', splitFocus: 'Lats, Upper Back & Biceps' },
        legs_titan: { focusGroups: [['Quadriceps', 'Hamstrings'], ['Glutes', 'Calves']], title: 'Legs & Posterior Chain Titan', splitFocus: 'Quads, Hamstrings & Glutes' },
        full_body: { focusGroups: [['Chest', 'Shoulders'], ['Back', 'Lats'], ['Quadriceps', 'Hamstrings'], ['Abdominals']], title: 'Full Body Functional AI Hybrid', splitFocus: 'Chest, Back, Legs & Core' },
        rehab_core: { focusGroups: [['Abdominals']], title: 'Rehab & Core Stability', splitFocus: 'Core & Mobility' }
      };
      const plan = SPLIT_FOCUS_GROUPS[action.payload];
      if (plan) {
        dispatch(generateWorkout(plan));
        toast.success(`🏋️ Switched active workout split!`);
      }
    } else if (action.type === 'SWAP_EXERCISE') {
      dispatch(swapExercise(action.payload));
      // Read fresh state via the store directly (not the closed-over `workout` prop,
      // which is stale until this component re-renders) so the persisted PATCH
      // actually contains the swapped exercise, not the pre-swap array.
      const freshWorkout = store.getState().workout.todayWorkout;
      if (freshWorkout?._id) {
        dispatch(persistWorkoutEdit({ id: freshWorkout._id, exercises: freshWorkout.exercises }));
      }
      toast.success("🔄 Exercise swapped for knee safety!");
    } else if (action.type === 'CHANGE_THEME') {
      setTheme(action.payload);
      toast.success(`🎨 Dashboard theme updated!`);
    } else if (action.type === 'SYNC_WEARABLE') {
      dispatch(setWearableModalOpen(true));
      toast.success("🩺 Opening Wearable Sync!");
    } else if (action.type === 'NAVIGATE') {
      navigate(action.payload);
      toast.success("🖼️ Navigated to Profile! Avatar Presets active.");
    }
  };

  // Command Execution: resolves intent via the real backend AI (shared with CoachChat), then
  // surfaces a confirmation card — never guesses or fabricates results.
  const handleCommand = async (inputText) => {
    if (!inputText || !inputText.trim()) return;

    setIsThinking(true);
    setChatMessages(prev => [...prev, { sender: 'user', text: inputText }]);

    let parsed;
    try {
      const appState = buildAppStateSnapshot({ nutrition, workout, theme });
      parsed = await resolveCoachAction(inputText, chatMessages, appState);
    } catch (err) {
      parsed = {
        replyText: "I couldn't reach the AI coach service right now, so nothing was changed. Please try again in a moment.",
        proposedAction: null
      };
    }

    setIsThinking(false);
    speak(parsed.replyText);
    setChatMessages(prev => [...prev, {
      sender: 'ai',
      text: parsed.replyText,
      proposedAction: parsed.proposedAction || null
    }]);
  };

  return (
    <SpatialCoachContext.Provider
      value={{
        coachMode,
        setCoachMode,
        speechText,
        isSpeaking,
        isThinking,
        isMuted,
        setIsMuted,
        gestureTrigger,
        navConfirmation,
        chatMessages,
        setChatMessages,
        executeProposedAction,
        stepOut,
        stepIn,
        speak,
        triggerGesture,
        handleCommand
      }}
    >
      {children}
    </SpatialCoachContext.Provider>
  );
}

