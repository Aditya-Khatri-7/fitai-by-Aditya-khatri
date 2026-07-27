import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setWearableModalOpen } from '../redux/slices/uiSlice';
import { removeSnacksFromMealPlan, addSnacksToMealPlan, swapDinnerToVegetarian, swapBreakfastMeal, updateSpecificMeal, updateMultipleMeals } from '../redux/slices/nutritionSlice';
import { selectWorkoutPlan, reshuffleWorkout, swapExercise, createMergedWorkoutPlan } from '../redux/slices/workoutSlice';
import { useTheme } from './ThemeContext';
import { resolveCoachAction, buildAppStateSnapshot } from '../services/coachActionService';
import { SpatialCoachContext } from './spatialCoachContextObject';
import toast from 'react-hot-toast';

export function SpatialCoachProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { theme, setTheme, isThemeSwitcherOpen, setIsThemeSwitcherOpen } = useTheme();
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

    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.02;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
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
    } else if (action.type === 'SWAP_BREAKFAST') {
      dispatch(swapBreakfastMeal(action.payload));
      toast.success("🥗 Breakfast updated to Scrambled Eggs & Turkey Bacon Toast!");
    } else if (action.type === 'SWAP_DINNER_VEG') {
      dispatch(swapDinnerToVegetarian());
      toast.success("🥗 Dinner updated to Paneer & Tofu Tikka Masala!");
    } else if (action.type === 'ADD_SNACKS') {
      dispatch(addSnacksToMealPlan());
      toast.success("🥗 Healthy Snack added to Nutrition Plan!");
    } else if (action.type === 'REMOVE_SNACKS') {
      dispatch(removeSnacksFromMealPlan());
      toast.success("🥗 Snacks removed from Nutrition Plan!");
    } else if (action.type === 'SWITCH_WORKOUT') {
      dispatch(selectWorkoutPlan(action.payload));
      toast.success(`🏋️ Switched active workout split!`);
    } else if (action.type === 'SWAP_EXERCISE') {
      dispatch(swapExercise(action.payload));
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

