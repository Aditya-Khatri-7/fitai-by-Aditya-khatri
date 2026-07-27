import { useContext } from 'react';
import { SpatialCoachContext } from './spatialCoachContextObject';

export function useSpatialCoach() {
  const context = useContext(SpatialCoachContext);
  if (!context) {
    throw new Error('useSpatialCoach must be used within SpatialCoachProvider');
  }
  return context;
}
