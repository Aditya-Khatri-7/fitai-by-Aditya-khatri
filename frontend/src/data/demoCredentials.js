// Real backend-seeded demo accounts (see backend/src/scripts/seedDemoUsers.js).
// Used to drive one-click "demo" logins on both the Landing and Login pages —
// these submit real credentials against the real backend, not fixture data.
export const DEMO_CREDENTIALS = {
  raj: { label: 'Raj Sharma — Muscle Gain / Knee Pain', email: 'raj@fitai.demo', password: 'FitAI@Demo1' },
  priya: { label: 'Priya Verma — Weight Loss / Hypertension', email: 'priya@fitai.demo', password: 'FitAI@Demo2' },
  test: { label: 'Test User — Start Fresh', email: 'test@fitai.demo', password: 'FitAI@Demo3' },
  arjun: { label: 'Arjun Mehta — Marathon Training', email: 'arjun@fitai.demo', password: 'FitAI@Demo4' }
};
