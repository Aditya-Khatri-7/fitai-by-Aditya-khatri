import { createContext } from 'react';

// Split into its own file (not exported alongside a component) so Vite/React-Refresh
// can hot-reload SpatialCoachContext.jsx without full-page remounts.
export const SpatialCoachContext = createContext();
