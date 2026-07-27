export const DEMO_HEATMAP_DATA = Array.from({ length: 90 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (89 - i));
  const dateStr = d.toISOString().split('T')[0];
  const count = (i % 7 === 0 || i % 7 === 4) ? 0 : (i % 3 === 0 ? 2 : 1);
  return { date: dateStr, count, level: count === 0 ? 0 : count === 1 ? 2 : 4 };
});
