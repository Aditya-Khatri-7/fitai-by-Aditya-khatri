import React, { useState, useEffect } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

// Real, non-fabricated motivational lines — generic training encouragement, not
// claims about the specific exercise or user's stats.
const MOTIVATION_QUOTES = [
  "Every rep today is a deposit into the version of you that shows up tomorrow.",
  "Form first, ego second — a controlled rep beats a rushed one every time.",
  "You don't have to be extreme, just consistent.",
  "The set that feels hardest is usually the one doing the most for you.",
  "Progress isn't always visible day to day — trust the process and log the work.",
  "Rest between sets is part of the training, not a break from it."
];

// One exercise visible at a time (a real stepper, not several cards competing for
// attention side-by-side) with a rotating motivational strip underneath — this is
// what the user explicitly asked for instead of the old horizontal-scroll row.
export function ExerciseCarousel({ exercises }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => { setActiveIdx(0); }, [exercises]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % MOTIVATION_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!exercises || exercises.length === 0) return null;

  const goPrev = () => setActiveIdx(i => Math.max(0, i - 1));
  const goNext = () => setActiveIdx(i => Math.min(exercises.length - 1, i + 1));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goPrev}
          disabled={activeIdx === 0}
          className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center justify-center gap-1.5">
          {exercises.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              aria-label={`Go to exercise ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === activeIdx ? 'w-6 bg-[var(--accent-primary)]' : 'w-1.5 bg-[var(--border-color)] hover:bg-[var(--text-tertiary)]'
              }`}
            />
          ))}
        </div>

        <span className="text-[10px] font-bold text-[var(--text-tertiary)] font-mono shrink-0">
          {activeIdx + 1} / {exercises.length}
        </span>

        <button
          onClick={goNext}
          disabled={activeIdx === exercises.length - 1}
          className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <ExerciseCard exercise={exercises[activeIdx]} index={activeIdx} />

      {/* Rotating motivational strip */}
      <div className="px-4 py-3 rounded-2xl bg-[var(--accent-glow)] border border-[var(--border-color)] flex items-center gap-2.5">
        <Quote className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
        <p key={quoteIdx} className="text-xs text-[var(--text-primary)] font-medium italic animate-in fade-in duration-500">
          {MOTIVATION_QUOTES[quoteIdx]}
        </p>
      </div>
    </div>
  );
}
