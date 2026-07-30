import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';
import { fetchMe } from './redux/slices/authSlice';
import { fetchGamificationState } from './redux/slices/gamificationSlice';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SpatialCoachProvider } from './context/SpatialCoachContext';
import { FitCompanion } from './components/companion/FitCompanion';
import { ProtectedRoute } from './components/routing/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { VerifyResetOtpPage } from './pages/VerifyResetOtpPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkoutsPage } from './pages/WorkoutsPage';
import { NutritionPage } from './pages/NutritionPage';
import { HealthPage } from './pages/HealthPage';
import { HealthUpdatePage } from './pages/HealthUpdatePage';
import { AICoachPage } from './pages/AICoachPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ProfilePage } from './pages/ProfilePage';
import { CheatPage } from './pages/CheatPage';

function AuthBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem('fitai_token')) {
      dispatch(fetchMe());
      dispatch(fetchGamificationState());
    }
  }, [dispatch]);

  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/workouts" element={<ProtectedRoute><WorkoutsPage /></ProtectedRoute>} />
      <Route path="/nutrition" element={<ProtectedRoute><NutritionPage /></ProtectedRoute>} />
      <Route path="/health" element={<ProtectedRoute><HealthPage /></ProtectedRoute>} />
      <Route path="/health-update" element={<ProtectedRoute><HealthUpdatePage /></ProtectedRoute>} />
      <Route path="/ai-coach" element={<ProtectedRoute><AICoachPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/cheat" element={<ProtectedRoute><CheatPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Wraps the companion widget and routed pages in ONE shared frame boundary. Without
// this, FitCompanion (fixed-positioned) is a sibling of the routes tree rather than a
// descendant of DashboardLayout's .mobile-mode frame div, so in the mobile preview
// its `fixed` overlays anchor to the real browser viewport instead of the simulated
// 390px frame and visibly bleed off its right edge.
function AppShell() {
  const { mobileMode } = useTheme();
  return (
    <div className={mobileMode ? 'mobile-mode' : ''}>
      <FitCompanion />
      <AppRoutes />
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <SpatialCoachProvider>
            <AuthBootstrap />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }
              }}
            />
            <AppShell />
          </SpatialCoachProvider>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
