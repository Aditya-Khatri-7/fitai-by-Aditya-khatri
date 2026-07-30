import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('fitai_theme') || 'burnt_circuit';
  });

  const [mobileMode, setMobileModeState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fitai_mobile_mode')) || false;
    } catch {
      return false;
    }
  });

  const [isBotEnabled, setIsBotEnabledState] = useState(() => {
    try {
      const saved = localStorage.getItem('fitai_bot_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [mouseTrackingEnabled, setMouseTrackingEnabledState] = useState(() => {
    try {
      const saved = localStorage.getItem('fitai_mouse_tracking');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [isThemeSwitcherOpen, setIsThemeSwitcherOpen] = useState(false);

  const [voiceStyle, setVoiceStyleState] = useState(() => {
    return localStorage.getItem('fitai_voice_style') || 'default';
  });

  const [voiceGender, setVoiceGenderState] = useState(() => {
    return localStorage.getItem('fitai_voice_gender') || 'female';
  });

  // Real narrow-viewport detection (an actual phone visiting the site) — distinct
  // from mobileMode, which is a manual 390px phone-frame *simulator* for desktop
  // users. Without this, a real phone got the full desktop sidebar (pl-64) squeezed
  // into its actual ~375px width since mobileMode defaults to false for everyone.
  const [isNarrowViewport, setIsNarrowViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsNarrowViewport(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = (name) => {
    setThemeState(name);
    localStorage.setItem('fitai_theme', name);
    document.documentElement.setAttribute('data-theme', name);
  };

  const LIGHT_THEME_IDS = new Set(['clinical_white', 'arctic_white', 'sand_dune', 'blossom', 'sage_light', 'golden_hour', 'lavender_dream']);
  const isLightTheme = LIGHT_THEME_IDS.has(theme);
  // Quick toggle within the same gold accent family (burnt_circuit <-> golden_hour)
  // rather than a generic light/dark switch, so the app keeps its brand color.
  const toggleLightDark = () => setTheme(isLightTheme ? 'burnt_circuit' : 'golden_hour');

  const setMobileMode = (val) => {
    const value = typeof val === 'function' ? val(mobileMode) : val;
    setMobileModeState(value);
    localStorage.setItem('fitai_mobile_mode', JSON.stringify(value));
  };

  const toggleMobileMode = () => {
    setMobileMode(prev => !prev);
  };

  const toggleBotEnabled = () => {
    setIsBotEnabledState(prev => {
      const next = !prev;
      localStorage.setItem('fitai_bot_enabled', JSON.stringify(next));
      return next;
    });
  };

  const VOICE_STYLES = ['default', 'soft', 'motivating'];
  const cycleVoiceStyle = () => {
    setVoiceStyleState(prev => {
      const next = VOICE_STYLES[(VOICE_STYLES.indexOf(prev) + 1) % VOICE_STYLES.length];
      localStorage.setItem('fitai_voice_style', next);
      return next;
    });
  };

  const toggleVoiceGender = () => {
    setVoiceGenderState(prev => {
      const next = prev === 'female' ? 'male' : 'female';
      localStorage.setItem('fitai_voice_gender', next);
      return next;
    });
  };

  const toggleMouseTracking = () => {
    setMouseTrackingEnabledState(prev => {
      const next = !prev;
      localStorage.setItem('fitai_mouse_tracking', JSON.stringify(next));
      if (typeof window !== 'undefined') {
        window.fitai_mouse_tracking_enabled = next;
      }
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.fitai_mouse_tracking_enabled = mouseTrackingEnabled;
    }
  }, [mouseTrackingEnabled]);

  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (mobileMode) {
      document.documentElement.style.setProperty('--app-width', '390px');
      if (rootEl) rootEl.classList.add('mobile-mode');
    } else {
      document.documentElement.style.removeProperty('--app-width');
      if (rootEl) rootEl.classList.remove('mobile-mode');
    }
  }, [mobileMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        mobileMode,
        setMobileMode,
        toggleMobileMode,
        isNarrowViewport,
        isLightTheme,
        toggleLightDark,
        isBotEnabled,
        toggleBotEnabled,
        mouseTrackingEnabled,
        toggleMouseTracking,
        isThemeSwitcherOpen,
        setIsThemeSwitcherOpen,
        voiceStyle,
        cycleVoiceStyle,
        voiceGender,
        toggleVoiceGender
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
