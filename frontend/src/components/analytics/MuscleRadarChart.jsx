import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { fetchWorkoutRange } from '../../redux/slices/workoutSlice';

const RANGE_DAYS = 30;

// Same keyword-bucketing approach as MuscleHeatmap.jsx, applied here to real
// exercise.muscleGroups tags from the last 30 days instead of a hardcoded array.
const MUSCLE_GROUPS = [
  { subject: 'Chest', keyWords: ['chest'] },
  { subject: 'Back', keyWords: ['back', 'lats'] },
  { subject: 'Legs', keyWords: ['quads', 'quadriceps', 'legs', 'hamstrings', 'calves', 'glutes'] },
  { subject: 'Shoulders', keyWords: ['shoulders', 'delt'] },
  { subject: 'Arms', keyWords: ['biceps', 'triceps', 'arms', 'forearms'] },
  { subject: 'Core', keyWords: ['abs', 'core'] }
];

export function MuscleRadarChart() {
  const dispatch = useDispatch();
  const { workoutRange } = useSelector(state => state.workout);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (RANGE_DAYS - 1));
    dispatch(fetchWorkoutRange({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }));
  }, [dispatch]);

  const { data, hasData } = useMemo(() => {
    const setsByGroup = Object.fromEntries(MUSCLE_GROUPS.map(g => [g.subject, 0]));

    for (const workout of workoutRange || []) {
      for (const ex of workout.exercises || []) {
        const tags = [...(ex.muscleGroups?.primary || []), ...(ex.muscleGroups?.secondary || [])].map(t => t.toLowerCase());
        for (const group of MUSCLE_GROUPS) {
          if (tags.some(t => group.keyWords.some(k => t.includes(k)))) {
            setsByGroup[group.subject] += ex.sets || 1;
          }
        }
      }
    }

    const totalSets = Object.values(setsByGroup).reduce((a, b) => a + b, 0);
    const radarData = MUSCLE_GROUPS.map(g => ({ subject: g.subject, A: setsByGroup[g.subject], fullMark: Math.max(20, ...Object.values(setsByGroup)) }));

    return { data: radarData, hasData: totalSets > 0 };
  }, [workoutRange]);

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">MUSCLE GROUP BALANCE RADAR (30 DAYS, SETS LOGGED)</h3>
      {hasData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} stroke="var(--border-color)" />
              <Radar name="Sets" dataKey="A" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-xs text-[var(--text-secondary)] text-center px-6">
          No workouts logged in the last 30 days yet — complete a few sessions to see your muscle balance here.
        </div>
      )}
    </div>
  );
}
