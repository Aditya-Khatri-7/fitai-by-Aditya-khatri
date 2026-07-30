import { useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const STYLE_PARAMS = {
  default: { rate: 1.0, pitch: 1.02 },
  soft: { rate: 0.9, pitch: 0.96 },
  motivating: { rate: 1.18, pitch: 1.1 }
};

const FEMALE_NAME_HINTS = ['female', 'zira', 'samantha', 'victoria', 'karen', 'tessa', 'moira', 'fiona', 'susan'];
const MALE_NAME_HINTS = ['male', 'david', 'daniel', 'alex', 'fred', 'mark'];

function pickVoice(voices, gender) {
  if (!voices.length) return null;
  const englishVoices = voices.filter(v => v.lang?.toLowerCase().startsWith('en'));
  const pool = englishVoices.length ? englishVoices : voices;
  const hints = gender === 'female' ? FEMALE_NAME_HINTS : MALE_NAME_HINTS;
  return pool.find(v => hints.some(h => v.name.toLowerCase().includes(h))) || pool[0];
}

/** Shared speech-synthesis hook so the "Voice Style" (soft/motivating/default) and
 * "Voice Gender" preferences set in MoreMenu apply everywhere the AI companion
 * speaks, instead of each component hand-tuning its own rate/pitch (previously
 * duplicated with slightly different values across SpatialCoachContext, CoachChat,
 * FitCompanion, ProactiveAIHUD, and Exercise3DDemo). */
export function useSpeech() {
  const { voiceStyle, voiceGender } = useTheme();
  const voicesRef = useRef([]);

  const getVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) voicesRef.current = voices;
    return voicesRef.current;
  }, []);

  const speak = useCallback((text, overrides = {}) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return null;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const params = STYLE_PARAMS[voiceStyle] || STYLE_PARAMS.default;
    utterance.rate = overrides.rate ?? params.rate;
    utterance.pitch = overrides.pitch ?? params.pitch;
    utterance.lang = 'en-US';

    const voice = pickVoice(getVoices(), voiceGender);
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
    return utterance;
  }, [voiceStyle, voiceGender, getVoices]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
}
