import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchMealPlanRange } from '../../redux/slices/nutritionSlice';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function NutritionCharts() {
  const dispatch = useDispatch();
  const { mealPlanRange } = useSelector(state => state.nutrition);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 6);
    dispatch(fetchMealPlanRange({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }));
  }, [dispatch]);

  const data = useMemo(() => {
    const byDate = new Map((mealPlanRange || []).map(mp => [new Date(mp.date).toDateString(), mp]));
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const plan = byDate.get(d.toDateString());
      days.push({
        day: DAY_LABELS[d.getDay()],
        calories: plan?.dailyTotals?.calories || 0,
        protein: plan?.dailyTotals?.protein || 0
      });
    }
    return days;
  }, [mealPlanRange]);

  const hasData = data.some(d => d.calories > 0);

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">WEEKLY CALORIC INTAKE COMPLIANCE</h3>
      {hasData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="day" stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-primary)' }} />
              <Bar dataKey="calories" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-xs text-[var(--text-secondary)] text-center px-6">
          No meal plans logged in the last 7 days yet — generate a meal plan from the Nutrition page to see your intake trend here.
        </div>
      )}
    </div>
  );
}
