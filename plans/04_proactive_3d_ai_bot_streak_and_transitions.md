# 3D AI Bot Mouse Tracking, Proactive Live Voice HUD, Streak System & Transition Animations Plan 🚀

This implementation plan details the addition of 3D mouse/pointer tracking for the AI Coach, proactive contextual AI suggestions with Web Speech voice playback, a gamified streak system, and smooth section transition animations across FitAI.

---

## 🎯 Proposed Features & Enhancements

### 1. Real-Time 3D AI Bot Mouse & Head Tracking
- Upgrade `ProceduralCoachRenderer.jsx` and `GLTFCoachRenderer.jsx` with a global screen mouse listener (`mousemove`).
- The 3D AI Coach's head, neck, and eyes will smoothly lerp to look **directly at the user's mouse cursor anywhere on the screen in real-time** ($\pm 45^\circ$ yaw, $\pm 30^\circ$ pitch).

### 2. Proactive AI Companion & Live Voice Advice HUD
- **Direct Click Action**: Clicking directly on the 3D AI Bot triggers a **Proactive AI Vision & Advice HUD** (replacing manual chat input).
- **Web Speech API Voice Synthesis**: Uses `window.speechSynthesis` to speak live advice, workout tips, and motivational quotes out loud!
- **Contextual Awareness**:
  - *Workouts Page*: Detects active plan and selected body part. Offers 1-click **"⚡ Condense Rest & Optimize (20 Mins)"** parameter adjustment.
  - *Dashboard / Profile*: Detects recovery score and level status, offering personalized tips (*"Recovery is 78%. Ready to crush today's session!"*).
- **Quick Action Bar**: "Motivate Me!", "Optimize Workout", and "Audio Mute/Unmute".

### 3. Gamified Streak System (`StreakFlame.jsx`)
- Dynamic streak counter with fire particle animations (`🔥 12-DAY WARRIOR STREAK`).
- Integrated into `TopNav.jsx` and `DashboardPage.jsx`.
- Streak freeze protection shield and daily streak XP bonus claim modal (+50 XP per day).

### 4. Gamified Section Transition Animations
- Smooth CSS/Framer keyframe transitions on route changes (`/dashboard`, `/workouts`, `/profile`, `/nutrition`, `/health`, etc.).
- Gamified section title toast with level progress HUD on route entry.
