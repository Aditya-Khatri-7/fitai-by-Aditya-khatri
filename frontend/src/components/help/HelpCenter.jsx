import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setHelpCenterOpen } from '../../redux/slices/uiSlice';
import { Modal } from '../ui/Modal';
import {
  Sparkles, Dumbbell, Utensils, Stethoscope, Trophy, PartyPopper, Users,
  ChevronDown, ShieldCheck, MessageCircleQuestion
} from 'lucide-react';

const HOW_IT_WORKS = [
  { icon: Dumbbell, color: 'text-blue-400', bg: 'bg-blue-500/15', title: 'Adaptive AI Workouts', desc: 'Every plan is generated from your goal, equipment, and recovery — not a static template.' },
  { icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/15', title: 'Personalized Meal Plans', desc: 'Respects your diet type, allergies, budget, and regional cuisine preference.' },
  { icon: Stethoscope, color: 'text-rose-400', bg: 'bg-rose-500/15', title: 'Injury & Health Aware', desc: 'Reported injuries or conditions automatically restrict unsafe exercises and adjust nutrition.' },
  { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/15', title: 'Gamified Progress', desc: 'Earn XP and level up your RPG character by completing workouts and daily quests.' },
  { icon: PartyPopper, color: 'text-purple-400', bg: 'bg-purple-500/15', title: 'Cheat Days, Earned', desc: 'Spend banked XP on a cheat meal or cheat day when life happens — capped weekly so it stays meaningful.' },
  { icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/15', title: 'Community', desc: 'Opt in from Profile to connect with other FitAI users and join shared challenges.' }
];

const FAQ = [
  { q: 'How does the AI actually adapt my plan?', a: 'It factors in your reported injuries, recovery score, available equipment, and workout history each time a plan is generated — it isn\'t a fixed template rotation.' },
  { q: 'What happens if I report an injury?', a: 'Go to Health Status Update (or Profile → Injuries). The AI immediately excludes exercises that load the affected area and suggests safe substitutions.' },
  { q: 'How do cheat days and cheat meals work?', a: 'You can set a free recurring weekly cheat day in Nutrition → Dietary Preferences. Separately, the Cheat Center (Calendar or More menu) lets you spend earned XP on an ad-hoc cheat meal or cheat day, capped per week.' },
  { q: 'Can I manually change a meal or workout instead of using AI?', a: 'Yes — every meal has a "Choose" option to pick an alternative or log your own, and workouts can be swapped exercise-by-exercise.' },
  { q: 'Is my health data private?', a: 'Health and injury data you enter is used only to personalize your own plans inside your account — see the Privacy note below.' }
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-3 p-3.5 text-left"
      >
        <span className="text-xs font-bold text-[var(--text-primary)]">{q}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="px-3.5 pb-3.5 text-[11px] text-[var(--text-secondary)] leading-relaxed animate-in fade-in duration-200">
          {a}
        </p>
      )}
    </div>
  );
}

export function HelpCenter() {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.ui.isHelpCenterOpen);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(setHelpCenterOpen(false))}
      title="Help & How FitAI Works"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/30">
          <Sparkles className="w-6 h-6 text-[var(--accent-primary)] shrink-0" />
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            FitAI builds your workout and nutrition plan fresh from your real profile — goals, equipment, injuries, and preferences — instead of handing everyone the same routine.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-wider">How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HOW_IT_WORKS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <h4 className="text-xs font-extrabold text-[var(--text-primary)]">{item.title}</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircleQuestion className="w-3.5 h-3.5" /> Quick FAQ
          </h3>
          <div className="space-y-2">
            {FAQ.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5">
          <h3 className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Privacy Note
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Health, injury, and dietary information you enter is used only to personalize your own workouts and meal plans within your account. You can edit or remove it anytime from Profile or Health Status Update.
          </p>
        </div>
      </div>
    </Modal>
  );
}
