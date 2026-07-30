import React, { useRef, useState, useEffect, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';
import { useSpeech } from '../../hooks/useSpeech';
import { useSpatialCoach } from '../../context/useSpatialCoach';
import { setWearableModalOpen } from '../../redux/slices/uiSlice';
import { CharacterRenderer } from '../../three/CharacterRenderer';
import { ParticleField } from '../../three/ParticleField';
import { AutoFramingCamera } from '../../three/AutoFramingCamera';
import { use3DThemeTokens } from '../../three/use3DThemeTokens';
import { ProactiveAIHUD } from './ProactiveAIHUD';
import { calculateRecoveryScore } from '../../utils/recoveryCalculator';
import {
  Sparkles,
  X,
  Mic,
  MicOff,
  Send,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Minimize2,
  Brain,
  TrendingUp,
  Dumbbell,
  MapPin,
  GripHorizontal,
  MessageSquare,
  Radio,
  Check,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export function FitCompanion() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const pathname = location.pathname;

  const { mobileMode, isBotEnabled, isNarrowViewport } = useTheme();
  const isCompactMobile = mobileMode || isNarrowViewport;
  const { speak: speakUtterance } = useSpeech();
  const {
    coachMode,
    setCoachMode,
    speechText,
    isSpeaking,
    isMuted,
    setIsMuted,
    navConfirmation,
    chatMessages,
    executeProposedAction,
    stepIn,
    handleCommand
  } = useSpatialCoach();

  const themeTokens = use3DThemeTokens();
  const modelRef = useRef();
  const controlsRef = useRef();

  const { user } = useSelector(state => state.auth);
  const { todayMetrics } = useSelector(state => state.health);
  const { todayWorkout } = useSelector(state => state.workout);
  const recovery = calculateRecoveryScore(todayMetrics, user);
  const recoveryLabel = recovery.isUncalibrated ? 'Uncalibrated (sync wearable)' : `${recovery.score}% (${recovery.status})`;
  const streakDays = user?.streak?.current ?? 0;
  const nextWorkoutLabel = todayWorkout ? (todayWorkout.splitFocus || todayWorkout.title) : 'Not generated yet';

  // Floating companion settings & Proactive Voice HUD state
  const [sizeScale, setSizeScale] = useState(190);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [isProactiveHUDOpen, setIsProactiveHUDOpen] = useState(false);
  const [executedActions, setExecutedActions] = useState({});

  // User-Controlled Persistent Positioning
  const [botDockPosition, setBotDockPosition] = useState(() => {
    return localStorage.getItem('fitai_bot_dock_pos') || 'bottom-right';
  });

  const [customPos, setCustomPos] = useState(() => {
    try {
      const saved = localStorage.getItem('fitai_bot_custom_pos');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userHasSetPosition, setUserHasSetPosition] = useState(() => {
    return localStorage.getItem('fitai_bot_user_pos_set') === 'true';
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, botX: 0, botY: 0 });

  const [scrollAdvice, setScrollAdvice] = useState('');
  const [hoverAdvice, setHoverAdvice] = useState('');

  const hoverTimeoutRef = useRef(null);
  const bubbleTimeoutRef = useRef(null);

  // Freeform Mouse Drag Handlers
  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    const container = e.currentTarget.closest('.bot-draggable-container');
    const rect = container ? container.getBoundingClientRect() : { left: window.innerWidth - 220, top: window.innerHeight - 280 };
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      botX: rect.left,
      botY: rect.top
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 220, dragStartRef.current.botX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 280, dragStartRef.current.botY + deltaY));
      const newPos = { x: newX, y: newY };
      setCustomPos(newPos);
      setUserHasSetPosition(true);
      localStorage.setItem('fitai_bot_custom_pos', JSON.stringify(newPos));
      localStorage.setItem('fitai_bot_user_pos_set', 'true');
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Instant Route Change Advice Update & Smart Non-Overlapping Auto-Docking
  useEffect(() => {
    if (!isBotEnabled) return;

    setHoverAdvice('');
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    let routeAdvice = '';
    if (pathname.includes('workouts')) {
      routeAdvice = "🏋️ Workouts Hub Active! Select workout splits or click muscles on the Body Map to generate plans.";
      if (!userHasSetPosition && !customPos) setBotDockPosition('bottom-left');
    } else if (pathname.includes('dashboard')) {
      routeAdvice = "⚡ Dashboard Hub Active! Complete daily RPG quests and check your recovery score.";
      if (!userHasSetPosition && !customPos) setBotDockPosition('bottom-right');
    } else if (pathname.includes('nutrition')) {
      routeAdvice = "🥗 Nutrition Hub Active! Log meals and check your daily macro target.";
      if (!userHasSetPosition && !customPos) setBotDockPosition('bottom-right');
    } else if (pathname.includes('health')) {
      routeAdvice = "🩺 Health Diagnostics Active! Check continuous heart rate and biometric signals.";
      if (!userHasSetPosition && !customPos) setBotDockPosition('bottom-right');
    } else if (pathname.includes('profile')) {
      if (!userHasSetPosition && !customPos) setBotDockPosition('bottom-left');

      if (location.search.includes('action=change_avatar')) {
        routeAdvice = "🖼️ Avatar Presets Active! Click any Avatar Preset image above to update your profile picture!";
      } else {
        routeAdvice = "🏆 RPG Character Profile Active! Inspect your 5-axis radar chart, achievements, and PR Hall of Fame!";
      }
    } else if (pathname.includes('analytics')) {
      routeAdvice = "📈 Analytics Studio Active! View long-term volume progression and performance trends.";
      if (!userHasSetPosition && !customPos) setBotDockPosition('bottom-right');
    } else if (pathname.includes('calendar')) {
      routeAdvice = "📅 Smart Calendar Active! Inspect scheduled AI workout cycles and rest days.";
      if (!userHasSetPosition && !customPos) setBotDockPosition('bottom-right');
    }

    setScrollAdvice(routeAdvice);
    setShowSpeechBubble(true);
  }, [pathname, location.search, isBotEnabled, customPos, userHasSetPosition]);

  // Realtime Scroll In-View Element Sensor
  useEffect(() => {
    if (!isBotEnabled) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (pathname.includes('dashboard')) {
        if (scrollY < 200) {
          setScrollAdvice("🏆 Daily Quests Hub Active! Claim your daily rewards for +250 XP bonus!");
        } else if (scrollY >= 200 && scrollY < 500) {
          setScrollAdvice(`📊 Biometric Diagnostic Stream: Recovery score is ${recoveryLabel}!`);
        } else if (scrollY >= 500 && scrollY < 900) {
          setScrollAdvice(todayWorkout
            ? `🏋️ Today's Workout: ${nextWorkoutLabel}. Click 'Start Gamified Session'!`
            : "🏋️ No workout generated yet — head to Workouts to build today's plan!");
        } else {
          setScrollAdvice(`🔥 ${streakDays}-Day Streak Active! Keep logging workouts to build momentum.`);
        }
        setShowSpeechBubble(true);
      } else if (pathname.includes('workouts')) {
        if (scrollY < 300) {
          setScrollAdvice("🏋️ Interactive Body Map & Workout Builder! Click any body part to switch splits.");
        } else {
          setScrollAdvice("⚡ Realtime Environment Simulator: Condense rest time or adjust training location!");
        }
        setShowSpeechBubble(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, isBotEnabled]);

  // Global Mouseover Hover Proactive Advice Engine
  useEffect(() => {
    if (!isBotEnabled) return;

    const handleMouseOver = (e) => {
      let target = e.target;
      while (target && target !== document.body) {
        const customTip = target.getAttribute && target.getAttribute('data-ai-tip');
        if (customTip) {
          setHoverAdvice(customTip);
          setShowSpeechBubble(true);
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = setTimeout(() => setHoverAdvice(''), 4000);
          return;
        }

        if (target.tagName === 'BUTTON' || target.tagName === 'A') {
          const text = (target.innerText || target.getAttribute('title') || '').trim();
          if (text.includes('Start Gamified Session')) {
            setHoverAdvice("⚡ Launching Live Arena! Tracks rep combos, set rest timers & awards post-workout loot XP!");
            setShowSpeechBubble(true);
            return;
          } else if (text.includes('Reshuffle')) {
            setHoverAdvice("🔀 AI rearranges exercise sequence to maximize antagonist muscle recovery!");
            setShowSpeechBubble(true);
            return;
          } else if (text.includes('Sync Wearable')) {
            setHoverAdvice("⌚ Pulls live heart rate, HRV, and sleep telemetry from Apple Health or Garmin!");
            setShowSpeechBubble(true);
            return;
          } else if (text.includes('Claim Reward')) {
            setHoverAdvice("🎉 Click to claim your daily quest XP bonus and rank up your character!");
            setShowSpeechBubble(true);
            return;
          } else if (text.includes('Show 3D') || text.includes('Show in 3D')) {
            setHoverAdvice("🎭 Opens 3D biomechanical animation showing perfect execution form!");
            setShowSpeechBubble(true);
            return;
          } else if (text.includes('Swap')) {
            setHoverAdvice("🔄 AI generates 3 clinical exercise alternatives matching your joint health!");
            setShowSpeechBubble(true);
            return;
          }
        }
        target = target.parentElement;
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [isBotEnabled]);

  // Typewriter + Speech Bubble Auto-Dismiss Lifecycle
  useEffect(() => {
    if (!isBotEnabled) return;

    const textToDisplay = hoverAdvice || scrollAdvice || speechText;
    setTypewriterText('');
    setShowSpeechBubble(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index < textToDisplay.length) {
        setTypewriterText(prev => prev + textToDisplay.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
        bubbleTimeoutRef.current = setTimeout(() => {
          if (!hoverAdvice && !scrollAdvice) setShowSpeechBubble(false);
        }, 5000);
      }
    }, 20);

    return () => {
      clearInterval(interval);
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, [speechText, hoverAdvice, scrollAdvice, isBotEnabled]);

  // Voice Speech Recognition
  const toggleVoiceListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      toast.success("Listening... Speak your command to 3D FitAI!");
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setIsListening(false);
        if (text) {
          toast.success(`Heard: "${text}"`);
          handleCommand(text);
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      rec.start();
    }
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleCommand(inputText);
    setInputText('');
  };

  // Direct Click on 3D Bot opens Proactive Vision & Live Voice Advice HUD
  const handleBotDirectClick = () => {
    setIsProactiveHUDOpen(prev => !prev);
    toast.success("🎯 3D AI Coach Vision & Proactive Voice Active!");
  };

  // Toggle Chat Box
  const toggleChatBox = () => {
    setCoachMode(prev => prev === 'chat' ? 'docked' : 'chat');
  };

  // Click handler for Cloud Speech Bubble
  const handleSpeechBubbleClick = () => {
    setIsProactiveHUDOpen(true);

    const textToSpeak = typewriterText || scrollAdvice || hoverAdvice || speechText;
    if (textToSpeak) speakUtterance(textToSpeak);

    if (pathname.includes('health')) {
      dispatch(setWearableModalOpen(true));
      toast.success("🩺 Opening Wearable Biometric Sync Modal!");
    } else if (pathname.includes('workouts')) {
      toast.success("⚡ Proactive AI Advice & Workout Optimizer Active!");
    } else if (pathname.includes('dashboard')) {
      toast.success("🏆 Daily Quests & RPG Level Hub Active!");
    }
  };

  const toggleDockPosition = () => {
    setCustomPos(null);
    localStorage.removeItem('fitai_bot_custom_pos');

    const positions = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
    const currentIndex = positions.indexOf(botDockPosition);
    const next = positions[(currentIndex + 1) % positions.length];
    
    setBotDockPosition(next);
    setUserHasSetPosition(true);
    localStorage.setItem('fitai_bot_dock_pos', next);
    localStorage.setItem('fitai_bot_user_pos_set', 'true');
    toast.success(`📍 3D Bot docked to ${next.replace('-', ' ').toUpperCase()}`);
  };

  if (!isBotEnabled) {
    return null;
  }

  const excludedRoutes = ['/', '/login', '/register', '/onboarding', '/ai-coach'];
  if (excludedRoutes.includes(pathname)) {
    return null;
  }

  const getDockPositionClass = () => {
    if (customPos) return '';
    if (botDockPosition === 'bottom-left') return 'bottom-6 left-6 pl-20 sm:pl-24';
    if (botDockPosition === 'top-left') return 'top-20 left-6 pl-20 sm:pl-24';
    if (botDockPosition === 'top-right') return 'top-20 right-6';
    return 'bottom-6 right-6';
  };

  const getZIndexClass = () => {
    if (coachMode === 'spatial') return 'z-[60]';
    if (coachMode === 'chat') return 'z-[50]';
    return 'z-[40]';
  };

  return (
    <>
      <ProactiveAIHUD
        isOpen={isProactiveHUDOpen}
        onClose={() => setIsProactiveHUDOpen(false)}
      />

      {isCompactMobile ? (
        <>
          <div className={`fixed bottom-20 right-4 z-[50] pointer-events-auto flex flex-col items-center gap-2`}>
            {/* Chat trigger — previously only reachable on desktop, mobile had no way
                to open the text/mic chat interface at all. */}
            <button
              onClick={toggleChatBox}
              title="Chat with 3D AI Coach"
              className="w-11 h-11 rounded-full bg-[var(--accent-primary)] text-slate-950 shadow-xl flex items-center justify-center hover:scale-110 transition-all"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <div
              onClick={handleBotDirectClick}
              className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all overflow-hidden animate-morph"
              title="Click for Proactive AI Voice Suggestions"
            >
              <Canvas gl={{ alpha: true }} camera={{ position: [0, 0.1, 1.2], fov: 45 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[1, 2, 1]} intensity={2.0} />
                <Suspense fallback={null}>
                  <CharacterRenderer isSpeaking={isSpeaking} isOverlayMode={false} />
                </Suspense>
              </Canvas>
            </div>
          </div>

          {/* Mobile chat sheet — same chat/mic functionality as desktop, laid out as
              a full-width bottom sheet instead of a floating 80/96-width box. */}
          {coachMode === 'chat' && (
            <div className="fixed inset-0 z-[55] flex flex-col justify-end pointer-events-none">
              <div onClick={() => setCoachMode('docked')} className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm pointer-events-auto" />
              <div className="relative pointer-events-auto rounded-t-3xl bg-[var(--bg-secondary)] border-t border-[var(--border-color)] shadow-2xl p-4 space-y-3 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs">3D FitAI Assistant</h4>
                      <p className="text-[10px] text-[var(--text-secondary)]">Voice & Chat Interface</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      title={isMuted ? 'Unmute Voice' : 'Mute Voice'}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[var(--accent-primary)]" />}
                    </button>
                    <button onClick={() => setCoachMode('docked')} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 overflow-y-auto pr-1 text-xs flex-1">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[var(--accent-primary)] text-slate-950 font-bold'
                          : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]'
                      }`}>
                        <p>{msg.text}</p>
                        {msg.proposedAction && (
                          <div className="mt-2 p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--accent-primary)]/50 space-y-1.5 text-[11px] animate-in zoom-in-95">
                            <div className="text-[9px] font-extrabold text-[var(--accent-primary)] flex items-center gap-1 uppercase tracking-wider">
                              <Sparkles className="w-3 h-3" /> PROPOSED SYSTEM CHANGE
                            </div>
                            <p className="font-extrabold text-[var(--text-primary)] leading-tight">{msg.proposedAction.description}</p>
                            {!executedActions[i] ? (
                              <button
                                onClick={() => { executeProposedAction(msg.proposedAction); setExecutedActions(prev => ({ ...prev, [i]: true })); }}
                                className="w-full mt-1 py-1.5 px-2 rounded-lg bg-[var(--accent-primary)] text-slate-950 font-extrabold text-[10px] shadow hover:opacity-90 transition-all flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3 stroke-[3]" /> YES, APPLY CHANGES
                              </button>
                            ) : (
                              <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 pt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> System Updated Successfully!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendText} className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-color)] shrink-0">
                  <input
                    type="text"
                    placeholder="Type command or talk to 3D AI Coach..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <button
                    type="button"
                    onClick={toggleVoiceListening}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--accent-primary)]'
                    }`}
                    title="Speak to 3D AI Coach Out Loud"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button type="submit" className="p-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-bold shadow">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      ) : coachMode === 'spatial' ? (
        <div className="fixed inset-0 z-[60] pointer-events-none flex flex-col items-center justify-between p-6 sm:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md pointer-events-auto" />

          <div className="relative z-10 text-center space-y-1 mt-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent-primary)] via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              3D AI COACH – SPATIAL INTERACTIVE MODE
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-semibold">
              Smooth, spatial 3D experience. Tracking mouse movements and guiding live.
            </p>
          </div>

          <div className="relative z-10 flex-1 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-6 pointer-events-none">
            <div className="w-80 p-4 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-2xl relative pointer-events-auto animate-morph">
              <p className="text-xs font-semibold leading-relaxed">
                {typewriterText}
              </p>
              {navConfirmation && (
                <div className="mt-3 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--accent-primary)]/40 text-[10px] space-y-1.5 animate-morph">
                  <div className="flex items-center justify-between font-bold text-[var(--accent-primary)]">
                    <span>✓ Understood</span>
                    <span>{navConfirmation.confidence}% match</span>
                  </div>
                  <div><span className="text-[var(--text-secondary)]">Intent:</span> {navConfirmation.intent}</div>
                  <div><span className="text-[var(--text-secondary)]">Action:</span> {navConfirmation.destination}</div>
                </div>
              )}
            </div>

            <div
              onClick={handleBotDirectClick}
              className="w-[380px] sm:w-[460px] h-[500px] relative pointer-events-auto flex items-center justify-center cursor-pointer"
              title="Click AI Coach for Live Voice Suggestions"
            >
              <Canvas
                gl={{
                  antialias: true,
                  alpha: true,
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 1.3
                }}
                camera={{ position: [0, 0, 3.2], fov: 45 }}
                style={{ background: 'transparent' }}
              >
                <ambientLight intensity={1.4} />
                <hemisphereLight skyColor={themeTokens.skyLightColor} groundColor={themeTokens.groundLightColor} intensity={1.1} />
                <directionalLight position={[3, 5, 4]} intensity={2.2} color={themeTokens.directionalLightColor} castShadow />
                <directionalLight position={[-3, 2, -2]} intensity={1.0} color={themeTokens.accentColor} />
                <pointLight position={[0, 0.5, 1.5]} intensity={1.8} color={themeTokens.pointLightColor} />

                <Suspense fallback={null}>
                  <group position={[0, 0.05, -0.4]}>
                    <mesh position={[0, 0, 0]}>
                      <ringGeometry args={[0.65, 0.72, 48]} />
                      <meshStandardMaterial
                        color={themeTokens.accentColor}
                        emissive={themeTokens.accentColor}
                        emissiveIntensity={2.0}
                        transparent
                        opacity={0.8}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  </group>

                  <CharacterRenderer ref={modelRef} isOverlayMode={true} />
                  <ParticleField isSpeaking={isSpeaking} />
                  <AutoFramingCamera targetRef={modelRef} targetCoverage={0.70} controlsRef={controlsRef} />
                </Suspense>

                <OrbitControls ref={controlsRef} enableZoom={false} enablePan={false} />
              </Canvas>
            </div>

            <div className="w-80 flex flex-col gap-3 pointer-events-auto animate-morph text-xs">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3.5 shadow-xl">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase block">Today's Focus</span>
                  <p className="font-extrabold text-[var(--text-primary)]">{todayWorkout ? (todayWorkout.splitFocus || todayWorkout.title) : 'No workout planned yet'}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3.5 shadow-xl">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase block">Recovery Score</span>
                  <p className="font-extrabold text-[var(--text-primary)]">{recoveryLabel}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3.5 shadow-xl">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase block">Active Streak</span>
                  <p className="font-extrabold text-[var(--text-primary)]">{streakDays} Day{streakDays === 1 ? '' : 's'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-xl flex flex-col items-center gap-3 pointer-events-auto mb-2 text-xs">
            <button
              onClick={stepIn}
              className="px-6 py-2.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] text-xs font-extrabold flex items-center gap-2 transition-all shadow-xl"
            >
              <Minimize2 className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Step Back Inside portal</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={customPos ? { left: `${customPos.x}px`, top: `${customPos.y}px`, right: 'auto', bottom: 'auto' } : {}}
          className={`bot-draggable-container fixed ${getDockPositionClass()} ${getZIndexClass()} pointer-events-auto flex flex-col items-end transition-all ${isDragging ? 'duration-0 cursor-grabbing' : 'duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)'}`}
        >
          {showSpeechBubble && (
            <div
              onClick={handleSpeechBubbleClick}
              title="Click to speak out loud & execute AI action!"
              className="mb-2 max-w-xs p-3.5 rounded-2xl bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] text-[var(--text-primary)] text-xs shadow-2xl relative animate-morph font-medium cursor-pointer hover:scale-[1.03] hover:border-[var(--accent-primary)] transition-all group"
            >
              <div className="flex items-center justify-between text-[10px] font-extrabold text-[var(--accent-primary)] uppercase mb-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 group-hover:animate-spin" /> 3D AI LIVE ADVICE
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-[var(--accent-glow)] text-[var(--accent-primary)] rounded font-mono font-bold">
                  CLICK ⚡
                </span>
              </div>
              <p className="font-semibold leading-relaxed group-hover:text-[var(--accent-primary)] transition-colors">
                {typewriterText}
              </p>
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[var(--bg-secondary)] border-b-2 border-r-2 border-[var(--accent-primary)] transform rotate-45"></div>
            </div>
          )}

          {coachMode === 'chat' && (
            <div className="mb-3 w-80 sm:w-96 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-2xl p-4 space-y-3 relative animate-morph">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs">3D FitAI Assistant</h4>
                    <p className="text-[10px] text-[var(--text-secondary)]">Voice & Chat Interface</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Unmute Voice" : "Mute Voice"}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[var(--accent-primary)]" />}
                  </button>
                  <button
                    onClick={() => setCoachMode('docked')}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[var(--accent-primary)] text-slate-950 font-bold'
                        : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]'
                    }`}>
                      <p>{msg.text}</p>

                      {/* Render Dataset Suggestions if present */}
                      {msg.datasetSuggestions && (
                        <div className="mt-2 space-y-1 border-t border-[var(--border-color)]/60 pt-1.5 text-[10px]">
                          <span className="font-extrabold text-[var(--accent-primary)] uppercase block">
                            📊 Clinical Dataset Suggestions:
                          </span>
                          {msg.datasetSuggestions.map((sug, idx) => (
                            <div key={idx} className="p-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] font-medium">
                              <span className="font-bold block text-[var(--text-primary)]">{sug.title}</span>
                              <span className="text-[9px] text-[var(--text-secondary)] block font-mono">{sug.details}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Interactive Proposal Confirmation Card */}
                      {msg.proposedAction && (
                        <div className="mt-2 p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--accent-primary)]/50 space-y-1.5 text-[11px] animate-in zoom-in-95">
                          <div className="text-[9px] font-extrabold text-[var(--accent-primary)] flex items-center gap-1 uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" /> PROPOSED SYSTEM CHANGE
                          </div>
                          <p className="font-extrabold text-[var(--text-primary)] leading-tight">{msg.proposedAction.description}</p>
                          {!executedActions[i] ? (
                            <button
                              onClick={() => {
                                executeProposedAction(msg.proposedAction);
                                setExecutedActions(prev => ({ ...prev, [i]: true }));
                              }}
                              className="w-full mt-1 py-1.5 px-2 rounded-lg bg-[var(--accent-primary)] text-slate-950 font-extrabold text-[10px] shadow hover:opacity-90 transition-all flex items-center justify-center gap-1"
                            >
                              <Check className="w-3 h-3 stroke-[3]" /> YES, APPLY CHANGES
                            </button>
                          ) : (
                            <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 pt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> System Updated Successfully!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Command Chips */}
              <div className="space-y-1 pt-1 border-t border-[var(--border-color)]">
                <span className="text-[9px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-wider block">
                  QUICK COMMAND SUGGESTIONS:
                </span>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  <button
                    onClick={() => handleCommand('go to profile and change my profile picture')}
                    className="px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--accent-glow)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] transition-all"
                  >
                    🖼️ Change Profile Picture
                  </button>
                  <button
                    onClick={() => handleCommand('sync wearable data')}
                    className="px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--accent-glow)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] transition-all"
                  >
                    ⌚ Sync Wearable Data
                  </button>
                  <button
                    onClick={() => handleCommand('open workouts')}
                    className="px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--accent-glow)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] transition-all"
                  >
                    🏋️ Workouts Studio
                  </button>
                </div>
              </div>

              {/* Input Form with Voice Mic & Speak Button */}
              <form onSubmit={handleSendText} className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-color)]">
                <input
                  type="text"
                  placeholder="Type command or talk to 3D AI Coach..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  type="button"
                  onClick={toggleVoiceListening}
                  className={`p-2 rounded-xl border transition-all ${
                    isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--accent-primary)]'
                  }`}
                  title="Speak to 3D AI Coach Out Loud"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button type="submit" className="p-2 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-bold shadow">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* 3D Docked Character Canvas with Drag & Chat Action Handles */}
          <div className="flex flex-col items-center group relative text-xs">
            {/* Top Toolbar Handles */}
            <div className="mb-1 bg-[var(--bg-secondary)]/95 backdrop-blur-md border border-[var(--border-color)] rounded-xl px-2 py-1 flex items-center gap-1.5 shadow-xl text-[10px] animate-morph">
              
              {/* Drag Handle */}
              <div
                onMouseDown={handleMouseDown}
                className="cursor-grab active:cursor-grabbing px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--accent-primary)] font-bold flex items-center gap-1 hover:bg-[var(--accent-glow)] transition-colors"
                title="Click and Hold to Drag 3D Bot Anywhere on Screen!"
              >
                <GripHorizontal className="w-3.5 h-3.5" />
                <span>Drag</span>
              </div>

              {/* Chat Button */}
              <button
                onClick={toggleChatBox}
                className={`px-2 py-0.5 rounded font-extrabold flex items-center gap-1 transition-all ${
                  coachMode === 'chat'
                    ? 'bg-[var(--accent-primary)] text-slate-950 shadow'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] border border-[var(--border-color)]'
                }`}
                title="Open Interactive Chat Window"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Chat</span>
              </button>

              {/* Talk Live Voice Button */}
              <button
                onClick={toggleVoiceListening}
                className={`px-2 py-0.5 rounded font-extrabold flex items-center gap-1 transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)] hover:text-slate-950'
                }`}
                title="Speak to 3D Coach Out Loud via Microphone"
              >
                <Radio className="w-3 h-3" />
                <span>Talk Live</span>
              </button>

              <button
                onClick={toggleDockPosition}
                className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-extrabold text-[9px] border border-[var(--border-color)] hover:border-[var(--accent-primary)] flex items-center gap-1 hidden sm:flex"
                title="Cycle Corner Preset (Bottom-Right, Bottom-Left, Top-Left, Top-Right)"
              >
                <MapPin className="w-3 h-3 text-[var(--accent-primary)]" /> Shift Dock
              </button>
            </div>

            <div
              onClick={handleBotDirectClick}
              style={{ width: `${sizeScale}px`, height: `${Math.round(sizeScale * 1.25)}px` }}
              className="cursor-pointer hover:scale-105 transition-transform"
              title="Click AI Coach for Proactive Live Voice & Advice"
            >
              <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0.1, 2.8], fov: 45 }}>
                <ambientLight intensity={1.3} />
                <directionalLight position={[2, 4, 3]} intensity={1.8} color={themeTokens.directionalLightColor} />
                <Suspense fallback={null}>
                  <CharacterRenderer ref={modelRef} isOverlayMode={false} />
                  <AutoFramingCamera targetRef={modelRef} targetCoverage={0.72} controlsRef={controlsRef} />
                </Suspense>
              </Canvas>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
