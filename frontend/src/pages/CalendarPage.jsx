import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Modal } from '../components/ui/Modal';
import { updateProfile } from '../redux/slices/authSlice';
import {
  fetchWorkoutRange,
  generateWorkout,
  generateWeekOfWorkouts,
  fetchStreakState
} from '../redux/slices/workoutSlice';
import {
  fetchMealPlanRange,
  generateMealPlan,
  generateWeekOfMealPlans
} from '../redux/slices/nutritionSlice';
import { fetchHealthSnapshot } from '../redux/slices/healthSlice';
import { calculateRecoveryScore } from '../utils/recoveryCalculator';
import { Sparkles, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Dumbbell, Utensils, Wand2, RefreshCw, PartyPopper, Settings2, ChevronDown, Pencil, TrendingUp, MessageSquare, History, Download, Flame, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { jsPDF } from 'jspdf';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function toDateKey(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDate(a, b) {
  return toDateKey(a) === toDateKey(b);
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // days since Sunday, matches DAY_LABELS/month grid
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(anchor) {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthGridDays(anchor) {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

// Cell tint reflects real completion state, not just a status dot — a completed day
// (streak credit earned) reads distinctly from a missed past day or a planned future one.
function cellTone(workout, isPast, isToday) {
  if (workout?.isCheatDay) return 'bg-purple-500/10 border-purple-500/40 text-purple-300';
  if (workout?.status === 'completed') return 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300';
  if (isPast && workout && workout.status !== 'completed') return 'bg-rose-500/10 border-rose-500/40 text-rose-300';
  if (isPast && !workout) return 'bg-[var(--bg-tertiary)]/60 border-[var(--border-color)] text-[var(--text-tertiary)]';
  if (isToday) return 'bg-[var(--bg-tertiary)] border-[var(--accent-primary)] text-[var(--text-primary)]';
  return 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]';
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// A little bonus surprise on the last page of every export — never anything
// load-bearing, just a wink that a real person built this.
const EASTER_EGGS = [
  'Psst... you found FitAI\'s secret note. Every dataset in this app was trained to root for you specifically.',
  'Fun fact: this PDF was rendered client-side in your browser -- zero servers were harmed (or billed) making it.',
  'Hidden achievement unlocked: "Actually Reads The Export" -- rarer than a completed leg day.',
  'True story: the AI behind this app would rather run on your GPU than a cloud bill. Efficiency is a love language.',
  'If you are reading this, you are more consistent than 73% of people who download a fitness app and never open it again.'
];

const PDF_ACCENT = [245, 158, 11]; // amber, matches the app's default theme accent
const PDF_MARGIN = 40;

function drawPdfHeader(doc, { docTitle, subtitle, userName }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 44;

  // Logo mark — a filled rounded square with an "F", mirroring the in-app
  // accent-colored icon badge rather than embedding a raster logo file.
  doc.setFillColor(...PDF_ACCENT);
  doc.roundedRect(PDF_MARGIN, y - 20, 26, 26, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('F', PDF_MARGIN + 13, y - 2, { align: 'center' });

  doc.setFontSize(19);
  doc.setTextColor(20, 20, 20);
  doc.text('FitAI', PDF_MARGIN + 34, y - 2);

  if (userName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`Prepared for ${userName}`, pageWidth - PDF_MARGIN, y - 6, { align: 'right' });
  }

  y += 18;
  doc.setDrawColor(...PDF_ACCENT);
  doc.setLineWidth(1.2);
  doc.line(PDF_MARGIN, y, pageWidth - PDF_MARGIN, y);
  y += 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PDF_ACCENT);
  doc.text(docTitle, PDF_MARGIN, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(90, 90, 90);
  doc.text(subtitle, PDF_MARGIN, y);
  doc.setTextColor(0, 0, 0);
  y += 22;
  return y;
}

function finalizePdfWithFooterAndEasterEgg(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 34;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(PDF_MARGIN, footerY, pageWidth - PDF_MARGIN, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text('FitAI -- AI-Powered Adaptive Fitness Intelligence Platform', PDF_MARGIN, footerY + 13);
    doc.text('Founder: Aditya Khatri', PDF_MARGIN, footerY + 24);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - PDF_MARGIN, footerY + 13, { align: 'right' });

    if (i === pageCount) {
      const egg = EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)];
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 180, 180);
      const eggLines = doc.splitTextToSize(egg, pageWidth - PDF_MARGIN * 2);
      doc.text(eggLines, pageWidth / 2, footerY - 12 - (eggLines.length - 1) * 9, { align: 'center' });
    }
  }
}

export function CalendarPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { workoutRange, loading: workoutLoading, streakState } = useSelector(state => state.workout);
  const { mealPlanRange, loading: nutritionLoading } = useSelector(state => state.nutrition);
  const chatHistory = useSelector(state => state.ai.chatHistory);
  const { todayMetrics } = useSelector(state => state.health);

  const [viewMode, setViewMode] = useState('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showCheatSettings, setShowCheatSettings] = useState(false);
  const [openChangeMenu, setOpenChangeMenu] = useState(null); // null | 'workout' | 'meal'
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [expandedChangeDate, setExpandedChangeDate] = useState(null);
  const [changesByDate, setChangesByDate] = useState({}); // dateKey -> versions[] | 'loading' | 'error'

  const visibleDays = useMemo(
    () => (viewMode === 'week' ? getWeekDays(anchorDate) : getMonthGridDays(anchorDate)),
    [viewMode, anchorDate]
  );

  useEffect(() => {
    const from = toDateKey(visibleDays[0]);
    const to = toDateKey(visibleDays[visibleDays.length - 1]);
    dispatch(fetchWorkoutRange({ from, to }));
    dispatch(fetchMealPlanRange({ from, to }));
  }, [dispatch, visibleDays]);

  useEffect(() => {
    dispatch(fetchStreakState());
    dispatch(fetchHealthSnapshot());
  }, [dispatch]);

  const workoutForDate = (date) => workoutRange.find(w => isSameDate(w.date, date));
  const mealPlanForDate = (date) => mealPlanRange.find(p => isSameDate(p.date, date));

  // Progress Report — derived entirely from data this page already fetches
  // (workoutRange/mealPlanRange/streakState), so it always matches whatever
  // range is currently on screen instead of hitting any new endpoint.
  const progressReport = useMemo(() => {
    const pastOrToday = visibleDays.filter(d => toDateKey(d) <= todayKeyMemo());
    const plannedWorkouts = pastOrToday.filter(d => workoutForDate(d) && !workoutForDate(d).isCheatDay);
    const completedWorkouts = plannedWorkouts.filter(d => workoutForDate(d).status === 'completed');
    const cheatDaysUsed = pastOrToday.filter(d => workoutForDate(d)?.isCheatDay).length;
    const mealsInRange = pastOrToday.map(d => mealPlanForDate(d)).filter(p => p && !p.isCheatDay && p.dailyTotals);
    const avgCalories = mealsInRange.length
      ? Math.round(mealsInRange.reduce((sum, p) => sum + (p.dailyTotals.calories || 0), 0) / mealsInRange.length)
      : null;
    return {
      plannedCount: plannedWorkouts.length,
      completedCount: completedWorkouts.length,
      completionRate: plannedWorkouts.length ? Math.round((completedWorkouts.length / plannedWorkouts.length) * 100) : 0,
      cheatDaysUsed,
      avgCalories,
      mealsLogged: mealsInRange.length
    };
  }, [visibleDays, workoutRange, mealPlanRange]);

  function todayKeyMemo() { return toDateKey(new Date()); }

  const changeableDays = useMemo(
    () => visibleDays.filter(d => {
      const w = workoutForDate(d);
      return w && !w.isCheatDay && (w.version || 1) > 1;
    }),
    [visibleDays, workoutRange]
  );

  const loadChangesForDate = async (date) => {
    const dateKey = toDateKey(date);
    if (expandedChangeDate === dateKey) { setExpandedChangeDate(null); return; }
    setExpandedChangeDate(dateKey);
    if (changesByDate[dateKey] && changesByDate[dateKey] !== 'error') return;
    const workout = workoutForDate(date);
    if (!workout?._id) return;
    setChangesByDate(prev => ({ ...prev, [dateKey]: 'loading' }));
    try {
      const { data } = await api.get(`/workouts/${workout._id}/versions`);
      setChangesByDate(prev => ({ ...prev, [dateKey]: data }));
    } catch (err) {
      setChangesByDate(prev => ({ ...prev, [dateKey]: 'error' }));
    }
  };

  const handleDownloadMealPlan = () => {
    const rangeName = viewMode === 'week' ? 'Week' : 'Month';
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageBottom = doc.internal.pageSize.getHeight() - 70;

    let y = drawPdfHeader(doc, { docTitle: 'Meal Plan', subtitle: rangeLabel, userName: user?.name });

    const ensureRoom = (needed) => {
      if (y + needed > pageBottom) {
        doc.addPage();
        y = drawPdfHeader(doc, { docTitle: 'Meal Plan (cont.)', subtitle: rangeLabel, userName: user?.name });
      }
    };

    visibleDays.forEach((d) => {
      const plan = mealPlanForDate(d);
      ensureRoom(60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);
      doc.text(d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }), PDF_MARGIN, y);
      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);

      if (!plan) {
        doc.setTextColor(140, 140, 140);
        doc.text('No meal plan for this day.', PDF_MARGIN + 12, y);
        doc.setTextColor(0, 0, 0);
        y += 18;
      } else if (plan.isCheatDay) {
        doc.text(`Cheat Day — ${plan.cheatMessage || 'enjoy!'}`, PDF_MARGIN + 12, y);
        y += 18;
      } else {
        (plan.meals || []).forEach((m) => {
          ensureRoom(16);
          const line = doc.splitTextToSize(`${m.type.toUpperCase()}: ${m.name} (${m.totalCalories} kcal)`, pageWidth - PDF_MARGIN * 2 - 12);
          doc.text(line, PDF_MARGIN + 12, y);
          y += 14 * line.length;
        });
        if (plan.dailyTotals) {
          doc.setFont('helvetica', 'bold');
          doc.text(`Total: ${plan.dailyTotals.calories} kcal`, PDF_MARGIN + 12, y);
          y += 16;
        }
      }
      y += 10;
    });

    finalizePdfWithFooterAndEasterEgg(doc);
    doc.save(`FitAI-Meal-Plan-${rangeName}-${toDateKey(visibleDays[0])}.pdf`);
    toast.success('Meal plan PDF downloaded!');
  };

  const handleDownloadProgressReportPdf = () => {
    const rangeName = viewMode === 'week' ? 'Week' : 'Month';
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PDF_MARGIN * 2;

    let y = drawPdfHeader(doc, { docTitle: 'Progress Report', subtitle: rangeLabel, userName: user?.name });

    // Stat tiles, 2 per row
    const tiles = [
      ['Workouts Completed', `${progressReport.completedCount} / ${progressReport.plannedCount}`, `${progressReport.completionRate}% completion rate`],
      ['Streak', `${streakState?.streak?.current ?? '--'} days`, `Best: ${streakState?.streak?.longest ?? '--'} days`],
      ['Avg Daily Calories', `${progressReport.avgCalories ?? '--'}`, `Across ${progressReport.mealsLogged} logged day(s)`],
      ['Cheat Days Used', `${progressReport.cheatDaysUsed}`, '']
    ];
    const tileW = (contentWidth - 12) / 2;
    tiles.forEach(([label, value, sub], idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const tx = PDF_MARGIN + col * (tileW + 12);
      const ty = y + row * 62;
      doc.setDrawColor(225, 225, 225);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(tx, ty, tileW, 52, 6, 6, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(130, 130, 130);
      doc.text(label.toUpperCase(), tx + 10, ty + 16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(20, 20, 20);
      doc.text(value, tx + 10, ty + 34);
      if (sub) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(sub, tx + 10, ty + 46);
      }
    });
    y += Math.ceil(tiles.length / 2) * 62 + 20;

    // Simple bar chart — one bar per visible day, height = daily calories logged.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('Daily Calories At A Glance', PDF_MARGIN, y);
    y += 16;
    const chartDays = visibleDays.slice(0, viewMode === 'week' ? 7 : 30);
    const chartHeight = 90;
    const barGap = 4;
    const barWidth = Math.max(4, (contentWidth - barGap * (chartDays.length - 1)) / chartDays.length);
    const maxCal = Math.max(...chartDays.map(d => mealPlanForDate(d)?.dailyTotals?.calories || 0), 1);
    const chartBaseline = y + chartHeight;
    chartDays.forEach((d, i) => {
      const cals = mealPlanForDate(d)?.dailyTotals?.calories || 0;
      const barH = cals > 0 ? Math.max(3, (cals / maxCal) * chartHeight) : 2;
      const bx = PDF_MARGIN + i * (barWidth + barGap);
      doc.setFillColor(cals > 0 ? PDF_ACCENT[0] : 225, cals > 0 ? PDF_ACCENT[1] : 225, cals > 0 ? PDF_ACCENT[2] : 225);
      doc.rect(bx, chartBaseline - barH, barWidth, barH, 'F');
    });
    doc.setDrawColor(200, 200, 200);
    doc.line(PDF_MARGIN, chartBaseline, PDF_MARGIN + contentWidth, chartBaseline);
    y = chartBaseline + 24;

    // Recommendations — plain rule-based logic derived from this same data,
    // not a fabricated AI response.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('Recommendations For Next Week', PDF_MARGIN, y);
    y += 16;
    const recs = [];
    if (progressReport.completionRate < 50) {
      recs.push('Your completion rate is under 50% — try locking in a fixed workout time each day rather than "whenever I have time."');
    } else if (progressReport.completionRate >= 80) {
      recs.push('Excellent consistency! Consider a progressive overload bump (add reps or weight) next week to keep adapting.');
    } else {
      recs.push('Solid, steady progress. Aim to close the gap on the day(s) you missed this range.');
    }
    if ((streakState?.streak?.current ?? 0) === 0) {
      recs.push('Your streak reset — the fastest way back is a short, easy win today rather than an all-or-nothing session.');
    }
    if (progressReport.cheatDaysUsed > 2) {
      recs.push('You used several cheat days this range — that\'s fine in moderation, just keep an eye on it trending upward.');
    }
    if (progressReport.avgCalories && progressReport.avgCalories < 1200) {
      recs.push('Average logged calories look low for sustained training — double check your meal plan is covering your real intake.');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    recs.forEach((r) => {
      const lines = doc.splitTextToSize(`- ${r}`, contentWidth - 8);
      doc.text(lines, PDF_MARGIN + 4, y);
      y += 14 * lines.length + 4;
    });
    y += 10;

    // Model Suggestion — the app's real recovery-scoring engine, honestly
    // labeled rather than inventing a prediction with no data behind it.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('Recovery Engine Suggestion', PDF_MARGIN, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (todayMetrics) {
      const recovery = calculateRecoveryScore(todayMetrics, user);
      doc.setTextColor(60, 60, 60);
      const line = doc.splitTextToSize(
        `Recovery Score: ${recovery.score}% (${recovery.status}) — recommended focus: ${recovery.category}.`,
        contentWidth
      );
      doc.text(line, PDF_MARGIN, y);
      y += 14 * line.length;
    } else {
      doc.setTextColor(140, 140, 140);
      const line = doc.splitTextToSize(
        'No biometric telemetry synced yet — sync a wearable or log today\'s sleep/soreness/stress to unlock a personalized recovery-based recommendation here.',
        contentWidth
      );
      doc.text(line, PDF_MARGIN, y);
      y += 14 * line.length;
    }

    finalizePdfWithFooterAndEasterEgg(doc);
    doc.save(`FitAI-Progress-Report-${rangeName}-${toDateKey(visibleDays[0])}.pdf`);
    toast.success('Progress report PDF downloaded!');
  };

  const goPrev = () => {
    const d = new Date(anchorDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setAnchorDate(d);
  };
  const goNext = () => {
    const d = new Date(anchorDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setAnchorDate(d);
  };
  const goToday = () => {
    const now = new Date();
    setAnchorDate(now);
    setSelectedDate(now);
  };

  const handlePlanWeek = async () => {
    const weekStartDate = toDateKey(startOfWeek(anchorDate));
    const results = await Promise.all([
      dispatch(generateWeekOfWorkouts(weekStartDate)),
      dispatch(generateWeekOfMealPlans(weekStartDate))
    ]);
    const failed = results.find(r => r.meta.requestStatus === 'rejected');
    if (failed) {
      toast.error(failed.payload || 'Failed to plan the week');
    } else {
      toast.success('AI planned your whole week — workouts & meals generated!');
    }
  };

  const handleAIRegenerateWorkout = async () => {
    setOpenChangeMenu(null);
    const r = await dispatch(generateWorkout({ date: toDateKey(selectedDate) }));
    if (generateWorkout.fulfilled.match(r)) toast.success('Workout changed!');
    else toast.error(r.payload || 'Failed to change workout');
  };

  const handleAIRegenerateMeal = async () => {
    setOpenChangeMenu(null);
    const r = await dispatch(generateMealPlan({ date: toDateKey(selectedDate) }));
    if (generateMealPlan.fulfilled.match(r)) toast.success('Meal plan changed!');
    else toast.error(r.payload || 'Failed to change meal plan');
  };

  const handleEditManually = (type) => {
    setOpenChangeMenu(null);
    const dateKey = toDateKey(selectedDate);
    navigate(type === 'workout' ? `/workouts?date=${dateKey}` : `/nutrition?date=${dateKey}`);
  };

  const cheatDays = user?.preferences?.cheatDays || [];
  const toggleCheatDay = (dayOfWeek) => {
    const existing = cheatDays.find(c => c.dayOfWeek === dayOfWeek);
    const next = existing
      ? cheatDays.filter(c => c.dayOfWeek !== dayOfWeek)
      : [...cheatDays, { dayOfWeek, type: 'full' }];
    dispatch(updateProfile({ preferences: { cheatDays: next } }));
  };
  const setCheatType = (dayOfWeek, type) => {
    const next = cheatDays.map(c => c.dayOfWeek === dayOfWeek ? { ...c, type } : c);
    dispatch(updateProfile({ preferences: { cheatDays: next } }));
  };

  const rangeLabel = viewMode === 'week'
    ? `${visibleDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${visibleDays[6].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
    : anchorDate.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const selectedWorkout = workoutForDate(selectedDate);
  const selectedMealPlan = mealPlanForDate(selectedDate);
  const isGenerating = workoutLoading || nutritionLoading;
  const todayKey = toDateKey(new Date());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] text-xs font-bold">
              Smart Adaptive Calendar
            </span>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{rangeLabel}</h2>
            <p className="text-xs text-[var(--text-secondary)]">Real workout & meal plan schedule from your account</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-1 text-xs font-bold">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'week' ? 'bg-[var(--accent-primary)] text-slate-950' : 'text-[var(--text-secondary)]'}`}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'month' ? 'bg-[var(--accent-primary)] text-slate-950' : 'text-[var(--text-secondary)]'}`}
              >
                <CalendarRange className="w-3.5 h-3.5" /> Month
              </button>
            </div>

            <button onClick={goPrev} className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goToday} className="px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] text-xs font-bold">
              Today
            </button>
            <button onClick={goNext} className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]">
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowCheatSettings(prev => !prev)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                showCheatSettings ? 'bg-[var(--accent-primary)] text-slate-950 border-transparent' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
              }`}
              title="Configure cheat days"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/cheat')}
              title="Cheat Center — spend earned XP on a cheat meal or cheat day"
              className="px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <PartyPopper className="w-4 h-4" /> Cheat Center
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              title="Progress report for this range"
              className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
            >
              <TrendingUp className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowChangesModal(true)}
              title="Changes log — what the AI or you edited"
              className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowChatModal(true)}
              title="Your AI coach chat history"
              className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadMealPlan}
              title="Download this range's meal plan as a PDF"
              className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handlePlanWeek}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-bold text-xs shadow-lg flex items-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" /> {isGenerating ? 'Planning...' : 'Plan My Whole Week'}
            </button>
          </div>
        </div>

        {showCheatSettings && (
          <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-purple-500/40 shadow-2xl space-y-3 animate-in fade-in duration-200">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-purple-400" /> Cheat Day Settings
            </h3>
            <p className="text-[11px] text-[var(--text-tertiary)]">Pick recurring days to skip your plan — full cheat, workout-only, or meal-only.</p>
            <div className="grid grid-cols-7 gap-2">
              {DAY_NAMES.map((name, dow) => {
                const config = cheatDays.find(c => c.dayOfWeek === dow);
                return (
                  <div key={dow} className="space-y-1.5">
                    <button
                      onClick={() => toggleCheatDay(dow)}
                      className={`w-full py-2 rounded-xl border text-[10px] font-bold transition-all ${
                        config ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                    {config && (
                      <select
                        value={config.type}
                        onChange={(e) => setCheatType(dow, e.target.value)}
                        className="w-full text-[9px] p-1 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                      >
                        <option value="full">Full</option>
                        <option value="workout_only">Workout</option>
                        <option value="meal_only">Meal</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--text-secondary)] pb-2 border-b border-[var(--border-color)]">
              {DAY_LABELS.map(l => <span key={l}>{l}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {visibleDays.map((d, idx) => {
                const workout = workoutForDate(d);
                const isToday = isSameDate(d, new Date());
                const isSelected = isSameDate(d, selectedDate);
                const isPast = toDateKey(d) < todayKey;
                const inCurrentMonth = viewMode === 'week' || d.getMonth() === anchorDate.getMonth();

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(d);
                      // Month view is for scanning the month at a glance — jump into
                      // that date's full week the moment the user wants day-level detail.
                      if (viewMode === 'month') {
                        setAnchorDate(d);
                        setViewMode('week');
                      }
                    }}
                    title={viewMode === 'month' ? 'View this whole week' : undefined}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between min-h-[75px] transition-all ${
                      isSelected ? 'ring-2 ring-[var(--accent-primary)]' : ''
                    } ${cellTone(workout, isPast, isToday)} ${inCurrentMonth ? '' : 'opacity-40'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-xs">{d.getDate()}</span>
                      {workout?.isCheatDay && <PartyPopper className="w-3 h-3 text-purple-400" />}
                      {!workout?.isCheatDay && workout && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            workout.status === 'completed' ? 'bg-emerald-400' : workout.status === 'skipped' ? 'bg-rose-400' : 'bg-amber-400'
                          }`}
                        ></span>
                      )}
                    </div>

                    <span className="text-[10px] font-semibold truncate w-full mt-1">
                      {workout?.isCheatDay ? 'Cheat Day' : workout ? (workout.splitFocus || workout.title) : (isToday ? 'No workout yet' : '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail Side Drawer */}
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-extrabold text-[var(--text-primary)]">
                  <Dumbbell className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Workout
                </div>
                {selectedWorkout && !selectedWorkout.isCheatDay && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenChangeMenu(openChangeMenu === 'workout' ? null : 'workout')}
                      disabled={isGenerating}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" /> Change <ChevronDown className="w-3 h-3" />
                    </button>
                    {openChangeMenu === 'workout' && (
                      <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl z-20 overflow-hidden text-[11px] animate-in fade-in duration-150">
                        <button onClick={handleAIRegenerateWorkout} className="w-full text-left px-3 py-2.5 hover:bg-[var(--bg-tertiary)] flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> AI Regenerate
                        </button>
                        <button onClick={() => handleEditManually('workout')} className="w-full text-left px-3 py-2.5 hover:bg-[var(--bg-tertiary)] flex items-center gap-2 text-[var(--text-primary)] font-semibold border-t border-[var(--border-color)]">
                          <Pencil className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Choose Manually
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedWorkout?.isCheatDay ? (
                <p className="text-purple-300 italic">🎉 {selectedWorkout.cheatMessage}</p>
              ) : selectedWorkout ? (
                <div className="space-y-1">
                  <p className="text-[var(--text-primary)] font-bold">{selectedWorkout.title}</p>
                  <p className="text-[var(--text-secondary)]">{selectedWorkout.splitFocus} &middot; {selectedWorkout.exercises?.length || 0} exercises &middot; {selectedWorkout.status}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[var(--text-tertiary)]">No workout planned for this day.</p>
                  <button
                    onClick={handleAIRegenerateWorkout}
                    disabled={isGenerating}
                    className="w-full py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] font-semibold text-xs border border-[var(--border-color)] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Generate Workout
                  </button>
                  <button
                    onClick={() => handleEditManually('workout')}
                    className="w-full py-2 rounded-lg bg-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] font-semibold text-xs border border-[var(--border-color)] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Build It Myself
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-extrabold text-[var(--text-primary)]">
                  <Utensils className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Meal Plan
                </div>
                {selectedMealPlan && !selectedMealPlan.isCheatDay && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenChangeMenu(openChangeMenu === 'meal' ? null : 'meal')}
                      disabled={isGenerating}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" /> Change <ChevronDown className="w-3 h-3" />
                    </button>
                    {openChangeMenu === 'meal' && (
                      <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl z-20 overflow-hidden text-[11px] animate-in fade-in duration-150">
                        <button onClick={handleAIRegenerateMeal} className="w-full text-left px-3 py-2.5 hover:bg-[var(--bg-tertiary)] flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> AI Regenerate
                        </button>
                        <button onClick={() => handleEditManually('meal')} className="w-full text-left px-3 py-2.5 hover:bg-[var(--bg-tertiary)] flex items-center gap-2 text-[var(--text-primary)] font-semibold border-t border-[var(--border-color)]">
                          <Pencil className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Choose Manually
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedMealPlan?.isCheatDay ? (
                <p className="text-purple-300 italic">🍔 {selectedMealPlan.cheatMessage}</p>
              ) : selectedMealPlan ? (
                <div className="space-y-1">
                  {selectedMealPlan.meals.map((m, i) => (
                    <p key={i} className="text-[var(--text-secondary)]">
                      <span className="text-[var(--text-primary)] font-bold uppercase text-[10px]">{m.type}:</span> {m.name} ({m.totalCalories} kcal)
                    </p>
                  ))}
                  <p className="text-[var(--text-tertiary)] pt-1">Total: {selectedMealPlan.dailyTotals?.calories} kcal</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[var(--text-tertiary)]">No meal plan for this day.</p>
                  <button
                    onClick={handleAIRegenerateMeal}
                    disabled={isGenerating}
                    className="w-full py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] font-semibold text-xs border border-[var(--border-color)] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Generate Meal Plan
                  </button>
                  <button
                    onClick={() => handleEditManually('meal')}
                    className="w-full py-2 rounded-lg bg-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] font-semibold text-xs border border-[var(--border-color)] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Plan It Myself
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title={`Progress Report — ${rangeLabel}`}>
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <p className="text-[var(--text-tertiary)] font-bold uppercase text-[10px] mb-1">Workouts Completed</p>
                <p className="text-xl font-extrabold text-[var(--text-primary)]">{progressReport.completedCount} / {progressReport.plannedCount}</p>
                <p className="text-[var(--text-secondary)] mt-0.5">{progressReport.completionRate}% completion rate</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <p className="text-[var(--text-tertiary)] font-bold uppercase text-[10px] mb-1 flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> Streak</p>
                <p className="text-xl font-extrabold text-[var(--text-primary)]">{streakState?.streak?.current ?? '--'} days</p>
                <p className="text-[var(--text-secondary)] mt-0.5">Best: {streakState?.streak?.longest ?? '--'} days</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <p className="text-[var(--text-tertiary)] font-bold uppercase text-[10px] mb-1">Avg Daily Calories</p>
                <p className="text-xl font-extrabold text-[var(--text-primary)]">{progressReport.avgCalories ?? '--'}</p>
                <p className="text-[var(--text-secondary)] mt-0.5">Across {progressReport.mealsLogged} logged day(s)</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-purple-500/30">
                <p className="text-[var(--text-tertiary)] font-bold uppercase text-[10px] mb-1 flex items-center gap-1"><PartyPopper className="w-3 h-3 text-purple-400" /> Cheat Days Used</p>
                <p className="text-xl font-extrabold text-[var(--text-primary)]">{progressReport.cheatDaysUsed}</p>
              </div>
            </div>
            <p className="text-[var(--text-tertiary)] italic">Numbers reflect {viewMode === 'week' ? 'this week' : 'this month'} up through today, based on your actual logged workouts and meals.</p>
            <button
              onClick={handleDownloadProgressReportPdf}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-bold text-xs shadow-lg flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" /> Download Full Report PDF
            </button>
          </div>
        </Modal>

        <Modal isOpen={showChangesModal} onClose={() => { setShowChangesModal(false); setExpandedChangeDate(null); }} title={`Changes Log — ${rangeLabel}`}>
          <div className="space-y-3 text-xs">
            {changeableDays.length === 0 ? (
              <p className="text-[var(--text-tertiary)] italic">No AI or manual workout edits recorded in this range yet.</p>
            ) : (
              changeableDays.map((d) => {
                const dateKey = toDateKey(d);
                const workout = workoutForDate(d);
                const entries = changesByDate[dateKey];
                const isExpanded = expandedChangeDate === dateKey;
                return (
                  <div key={dateKey} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] overflow-hidden">
                    <button
                      onClick={() => loadChangesForDate(d)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-primary)]/40 transition-colors"
                    >
                      <span className="font-bold text-[var(--text-primary)]">{d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="text-[var(--text-secondary)] flex items-center gap-2">
                        v{workout.version || 1} &middot; {(workout.version || 1) - 1} edit(s)
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-2 border-t border-[var(--border-color)] pt-2">
                        {entries === 'loading' && <p className="text-[var(--text-tertiary)]">Loading...</p>}
                        {entries === 'error' && <p className="text-rose-400">Failed to load changes for this day.</p>}
                        {Array.isArray(entries) && entries.map((v) => (
                          <div key={v.version} className="p-2.5 rounded-lg bg-[var(--bg-primary)]/40">
                            <p className="font-bold text-[var(--text-primary)]">v{v.version} &middot; <span className="font-normal text-[var(--text-secondary)]">{v.reason}</span></p>
                            <p className="text-[var(--text-secondary)] mt-0.5">{v.changes}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Modal>

        <Modal isOpen={showChatModal} onClose={() => setShowChatModal(false)} title="AI Coach Chat History">
          <div className="space-y-3 text-xs">
            <p className="text-[var(--text-tertiary)] italic">Current session — resets when the app reloads.</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`p-3 rounded-xl max-w-[85%] ${msg.sender === 'ai' ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'bg-[var(--accent-glow)] text-[var(--accent-primary)] ml-auto'}`}>
                  <p>{msg.text}</p>
                  <p className="text-[10px] opacity-60 mt-1">{msg.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
