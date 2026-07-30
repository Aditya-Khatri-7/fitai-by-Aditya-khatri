import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addChatMessage, setSpeakingState, setThinkingState } from '../../redux/slices/aiSlice';
import { removeSnacksFromMealPlan, addSnacksToMealPlan, swapDinnerToVegetarian, swapBreakfastMeal, updateSpecificMeal, updateMultipleMeals } from '../../redux/slices/nutritionSlice';
import { selectWorkoutPlan, reshuffleWorkout, swapExercise, createMergedWorkoutPlan } from '../../redux/slices/workoutSlice';
import { setWearableModalOpen } from '../../redux/slices/uiSlice';
import { useTheme } from '../../context/ThemeContext';
import { useSpeech } from '../../hooks/useSpeech';
import { resolveCoachAction, buildAppStateSnapshot } from '../../services/coachActionService';
import { Send, Bot, Sparkles, User, Mic, MicOff, Volume2, VolumeX, Check, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function CoachChat() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { speak: speakUtterance } = useSpeech();
  const { chatHistory } = useSelector(state => state.ai);
  const nutrition = useSelector(state => state.nutrition);
  const workout = useSelector(state => state.workout);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [executedActions, setExecutedActions] = useState({});
  const recognitionRef = useRef(null);

  const quickPrompts = [
    "change my breakfast to non veg and my lunch to veg",
    "Train chest and legs today (merge workout plans)",
    "ok lets have a veg breakfast a good and heavy one having atleast 5 things",
    "Swap dinner to a high-protein vegetarian plan"
  ];

  // Speech Output
  const speakText = (text) => {
    if (isMuted) return;
    speakUtterance(text);
  };

  // Voice Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          handleSend(transcript);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
        toast.error("Voice input quiet or error");
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      toast.error("Voice Recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      toast.success("Listening... Speak your query to 3D Coach!");
      recognitionRef.current.start();
    }
  };

  // Handle User Input & Proposed Actions
  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Add User Message
    dispatch(addChatMessage({ sender: 'user', text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));
    if (!textToSend) setInput('');

    // Trigger AI Thinking state
    dispatch(setThinkingState(true));

    let parsed;
    try {
      const appState = buildAppStateSnapshot({ nutrition, workout, theme });
      parsed = await resolveCoachAction(text, chatHistory, appState);
    } catch (err) {
      parsed = {
        replyText: "I couldn't reach the AI coach service right now, so nothing was changed. Please try again in a moment.",
        proposedAction: null
      };
    }

    dispatch(setThinkingState(false));
    dispatch(setSpeakingState(true));

    dispatch(addChatMessage({
      sender: 'ai',
      text: parsed.replyText,
      proposedAction: parsed.proposedAction || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    speakText(parsed.replyText);

    setTimeout(() => {
      dispatch(setSpeakingState(false));
    }, 3500);
  };

  // Execute Proposed Action when User Clicks "YES, APPLY CHANGES"
  const handleConfirmAction = (msgIndex, action) => {
    if (!action) return;

    if (action.type === 'UPDATE_MULTIPLE_MEALS') {
      dispatch(updateMultipleMeals(action.payload));
      toast.success("🥗 Multi-meal updates applied to system!");
    } else if (action.type === 'MERGE_WORKOUT_PLANS') {
      dispatch(createMergedWorkoutPlan(action.payload));
      toast.success(`🏋️ Merged workout plan created! Updated in system.`);
    } else if (action.type === 'UPDATE_CUSTOM_MEAL') {
      dispatch(updateSpecificMeal(action.payload));
      toast.success(`🥗 Meal plan updated to ${action.payload.name}!`);
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
      toast.success("🩺 Opening Wearable Biometric Telemetry Sync!");
    } else if (action.type === 'NAVIGATE') {
      navigate(action.payload);
      toast.success("🖼️ Navigated to Profile! Avatar Presets active.");
    }

    setExecutedActions(prev => ({ ...prev, [msgIndex]: true }));
  };

  return (
    <div className="h-full flex flex-col justify-between p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4 text-[var(--text-primary)] transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-extrabold">3D AI Coach Conversation Studio</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[var(--accent-primary)]" />}
          </button>
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] text-[10px] font-bold border border-[var(--accent-primary)]/30">
            Gemini 1.5 Pro AI
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-[300px] max-h-[420px] text-xs">
        {chatHistory.map((msg, i) => {
          const isExecuted = executedActions[i];
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'ai'
                    ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)]'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                  msg.sender === 'ai'
                    ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]'
                    : 'bg-[var(--accent-primary)] text-slate-950 font-bold'
                }`}
              >
                <p>{msg.text}</p>

                {/* Dataset Suggestions from USDA & Indian IFCT */}
                {msg.datasetSuggestions && (
                  <div className="mt-2.5 space-y-1.5 border-t border-[var(--border-color)]/60 pt-2 text-[11px]">
                    <span className="text-[10px] font-extrabold text-[var(--accent-primary)] uppercase flex items-center gap-1">
                      📊 Clinical Dataset Suggestions (USDA & IFCT):
                    </span>
                    {msg.datasetSuggestions.map((sug, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between">
                        <div>
                          <span className="font-extrabold block text-[var(--text-primary)]">{sug.title}</span>
                          <span className="text-[10px] text-[var(--text-secondary)] block font-mono">{sug.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Interactive Confirmation Card when AI proposes a system change */}
                {msg.proposedAction && (
                  <div className="mt-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--accent-primary)]/50 space-y-2 text-xs animate-in zoom-in-95">
                    <div className="text-[10px] font-extrabold text-[var(--accent-primary)] flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> PROPOSED SYSTEM CHANGE
                    </div>
                    <p className="font-extrabold text-[var(--text-primary)]">{msg.proposedAction.description}</p>

                    {!isExecuted ? (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmAction(i, msg.proposedAction)}
                          className="flex-1 py-2 px-3 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-xs shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> YES, APPLY CHANGES
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
                        <CheckCircle2 className="w-4 h-4" /> System Updated Successfully!
                      </div>
                    )}
                  </div>
                )}

                <span className="text-[9px] opacity-60 block mt-1.5 text-right font-mono">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Prompts */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" /> Quick Suggested Queries:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="px-2.5 py-1 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[11px] text-left transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input & Voice Controls */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask your 3D AI Coach anything about your health, injury, or diet..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] text-xs"
        />

        {/* Voice Button */}
        <button
          type="button"
          onClick={toggleVoiceListening}
          className={`p-2.5 rounded-xl border transition-all ${
            isListening
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
              : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--accent-primary)] hover:bg-[var(--accent-glow)]'
          }`}
          title="Voice Command Input"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-bold text-xs shadow-lg flex items-center justify-center hover:opacity-90 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
