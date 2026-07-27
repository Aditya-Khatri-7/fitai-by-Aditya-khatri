# Mobile Viewport & Layout Architecture Plan 📱

This document outlines the implementation plan and fixes applied to eliminate layout squishing, text vertical wrapping, navigation bugs, and viewport framing issues in mobile simulation mode.

---

## 🎯 Problem Statement & Root Cause Analysis

1. **Desktop Breakpoint Collision in Frame Simulation**:
   - Tailwind media queries (`sm:`, `md:`, `lg:`) evaluate against `@media (min-width: ...)` using the **browser window width** (e.g. 1707px), NOT the 390px `.mobile-mode` container width.
   - This caused 3-column desktop grid layouts (`grid-cols-3`) to squeeze into a 390px container, resulting in 150px wide columns where text wrapped into single-character vertical columns.

2. **Scrolled Sidebar Issue**:
   - Setting `overflow-y: auto` on the `.mobile-mode` container caused `position: fixed` children inside it (`transform: translateZ(0)`) to scroll away with page content, cutting off the top logo header.

---

## 🛠 Fix Architecture & Implementation Details

### 1. Dynamic `mobileMode` Component Overrides
- Integrated `mobileMode` state check from `ThemeContext.jsx` into React components:
  - `GamifiedProfile.jsx`: Replaced `grid-cols-3` with `grid-cols-1` when `mobileMode` is true.
  - `DailyQuestsCard.jsx`: Forced `grid-cols-1` quest cards.
  - `WorkoutBuilder.jsx`: Forced `flex-col` single-column vertical stack.
  - `DashboardPage.jsx`: Dynamic `grid-cols-1` layout across all biometric, recovery, and statistics widgets.

### 2. Pinned Navigation & Frame Scrolling Architecture
- Updated `index.css`:
  - `.mobile-mode`: Set `height: 844px !important; overflow: hidden; position: relative;`.
- Updated `DashboardLayout.jsx`:
  - Enforced fixed header container height (`h-[832px] overflow-hidden`).
  - Scrolled ONLY the `<main>` card panel (`h-[calc(832px-60px)] overflow-y-auto`).
  - `Sidebar.jsx` and `TopNav.jsx` stay **100% static and pinned** to the phone frame.

### 3. Responsive Text Handling
- Added `truncate`, `whitespace-nowrap`, `min-w-0`, `flex-wrap`, and `shrink-0` across `TopNav.jsx`, `Sidebar.jsx`, and `ExerciseCard.jsx` to prevent text truncation bugs.

---

## 🧪 Verification & Results
- Verified clean build (`npm run build`).
- Confirmed zero text wrapping issues in 390px Mobile View.
