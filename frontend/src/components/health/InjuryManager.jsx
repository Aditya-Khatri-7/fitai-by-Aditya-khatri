import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../redux/slices/authSlice';
import { Modal } from '../ui/Modal';
import { HealthUpdateWizard } from './HealthUpdateWizard';
import { ShieldAlert, Plus, AlertTriangle, Dumbbell, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Rehab suggestions call the already-trained, real megaGymDataset exercise
// recommender with a rehab-tuned query (beginner level, low-impact equipment,
// avoid-list built from the injury's own restrictions) rather than a separate
// model — see backend mlController.getRehabExerciseSuggestions for why.
function RehabSuggestions({ bodyPart, restrictions }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ml/rehab-suggestions', { bodyPart, restrictions });
      setSuggestions(data.recommendations || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (suggestions === null) {
    return (
      <button
        onClick={load}
        disabled={loading}
        className="text-[10px] font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Dumbbell className="w-3 h-3" />}
        Suggest rehab-safe exercises
      </button>
    );
  }

  if (suggestions.length === 0) {
    return <p className="text-[10px] text-[var(--text-tertiary)] italic">No matching low-impact exercises found right now.</p>;
  }

  return (
    <div className="pt-1 space-y-1">
      <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Rehab-Safe Suggestions</span>
      {suggestions.slice(0, 4).map((ex, i) => (
        <div key={i} className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
          <span>{ex.name} <span className="text-[var(--text-tertiary)]">({ex.equipment})</span></span>
          <span className="text-[var(--accent-primary)] font-mono text-[10px]">{Math.round((ex.similarity_score || 0) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

// "Report Injury" opens the full AI Clinical Intake wizard (same one used from
// Health Status Update) instead of a bare body-part/severity form, so every entry
// point into injury reporting gets the same anatomical pain map, condition catalog,
// and AI risk analysis. `nested` bumps the inner modal's z-index above an outer
// modal when this component is itself shown inside one (e.g. from GamifiedProfile).
export function InjuryManager({ nested = false }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const injuries = user?.injuries || [];

  const [showWizard, setShowWizard] = useState(false);

  const handleResolveInjury = (idx) => {
    const updated = injuries.map((inj, i) => i === idx ? { ...inj, isActive: false } : inj);
    dispatch(updateProfile({ injuries: updated }));
    toast.success('Injury marked resolved — AI will lift related exercise restrictions.');
  };

  const activeInjuries = injuries.filter(inj => inj.isActive !== false);
  const resolvedInjuries = injuries.filter(inj => inj.isActive === false);

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2 min-w-0">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" /> <span className="break-words">Injury Manager & Exercise Constraints</span>
        </h3>
        <button
          onClick={() => setShowWizard(true)}
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Report Injury
        </button>
      </div>

      {/* Active Injury List */}
      <div className="space-y-3 text-xs">
        {activeInjuries.length === 0 ? (
          <p className="text-[var(--text-tertiary)] italic">No active injuries reported. All movements unrestricted.</p>
        ) : (
          activeInjuries.map((inj) => {
            const idx = injuries.indexOf(inj);
            return (
              <div key={idx} className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-extrabold text-[var(--text-primary)] uppercase truncate">{inj.bodyPart} {inj.type}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] uppercase shrink-0">
                      {inj.severity}
                    </span>
                  </div>
                  <span className="text-[var(--text-tertiary)] text-[11px] shrink-0">Reported: {new Date(inj.dateReported).toLocaleDateString()}</span>
                </div>
                <p className="text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Restrictions: </strong>
                  {inj.restrictions?.join(', ') || 'Avoid heavy strain'}
                </p>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => handleResolveInjury(idx)}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Mark Resolved
                  </button>
                </div>
                <RehabSuggestions bodyPart={inj.bodyPart} restrictions={inj.restrictions || []} />
              </div>
            );
          })
        )}
      </div>

      {resolvedInjuries.length > 0 && (
        <div className="pt-3 border-t border-[var(--border-color)] space-y-2 text-xs">
          <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Resolved</span>
          {resolvedInjuries.map((inj, idx) => (
            <p key={idx} className="text-[var(--text-tertiary)] line-through">{inj.bodyPart} {inj.type} ({inj.severity})</p>
          ))}
        </div>
      )}

      <Modal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        title="AI Clinical Intake & Health Update"
        maxWidth="max-w-4xl"
        nested={nested}
      >
        <HealthUpdateWizard embedded onComplete={() => setShowWizard(false)} />
      </Modal>
    </div>
  );
}
