import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../redux/slices/authSlice';
import { addAIMemory } from '../../redux/slices/healthSlice';
import { ShieldAlert, Plus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export function InjuryManager() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const injuries = user?.injuries || [];

  const [showAdd, setShowAdd] = useState(false);
  const [bodyPart, setBodyPart] = useState('knee');
  const [severity, setSeverity] = useState('moderate');
  const [restrictions, setRestrictions] = useState('');

  const handleAddInjury = () => {
    const newInj = {
      id: `inj_${Date.now()}`,
      bodyPart,
      type: 'strain',
      severity,
      dateReported: new Date().toISOString().split('T')[0],
      isActive: true,
      restrictions: restrictions ? restrictions.split(',') : ['Avoid heavy loading']
    };

    const updated = [...injuries, newInj];
    dispatch(updateProfile({ injuries: updated }));

    dispatch(addAIMemory({
      id: `mem_${Date.now()}`,
      timestamp: new Date().toISOString().split('T')[0],
      eventType: 'injury_reported',
      title: `${bodyPart.toUpperCase()} ${severity} Reported`,
      details: `User reported new ${bodyPart} ${severity} injury. AI updated exercise dependency graph.`
    }));

    toast.success(`Logged ${bodyPart} injury. AI Workout adapted!`);
    setShowAdd(false);
  };

  const handleResolveInjury = (idx) => {
    const updated = injuries.map((inj, i) => i === idx ? { ...inj, isActive: false } : inj);
    dispatch(updateProfile({ injuries: updated }));
    toast.success('Injury marked resolved — AI will lift related exercise restrictions.');
  };

  const activeInjuries = injuries.filter(inj => inj.isActive !== false);
  const resolvedInjuries = injuries.filter(inj => inj.isActive === false);

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" /> INJURY MANAGER & EXERCISE CONSTRAINTS
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Report Injury
        </button>
      </div>

      {showAdd && (
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-rose-500/40 space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[var(--text-secondary)] font-bold block mb-1">Body Part</label>
              <select
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                className="w-full p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >
                <option value="knee">Knee</option>
                <option value="shoulder">Shoulder</option>
                <option value="lower_back">Lower Back</option>
                <option value="wrist">Wrist</option>
                <option value="ankle">Ankle</option>
                <option value="elbow">Elbow</option>
              </select>
            </div>
            <div>
              <label className="text-[var(--text-secondary)] font-bold block mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >
                <option value="mild">Mild Pain</option>
                <option value="moderate">Moderate Strain</option>
                <option value="severe">Severe / Post-Op</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[var(--text-secondary)] font-bold block mb-1 text-xs">Custom Restrictions (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. No heavy deep squats, No box jumps"
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              className="w-full p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs"
            />
          </div>
          <button
            onClick={handleAddInjury}
            className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg"
          >
            Save & Trigger AI Adaptation
          </button>
        </div>
      )}

      {/* Active Injury List */}
      <div className="space-y-3 text-xs">
        {activeInjuries.length === 0 ? (
          <p className="text-[var(--text-tertiary)] italic">No active injuries reported. All movements unrestricted.</p>
        ) : (
          activeInjuries.map((inj) => {
            const idx = injuries.indexOf(inj);
            return (
              <div key={idx} className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="font-extrabold text-[var(--text-primary)] uppercase">{inj.bodyPart} {inj.type}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] uppercase">
                      {inj.severity}
                    </span>
                  </div>
                  <span className="text-[var(--text-tertiary)] text-[11px]">Reported: {new Date(inj.dateReported).toLocaleDateString()}</span>
                </div>
                <p className="text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Restrictions: </strong>
                  {inj.restrictions?.join(', ') || 'Avoid heavy strain'}
                </p>
                <button
                  onClick={() => handleResolveInjury(idx)}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Mark Resolved
                </button>
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
    </div>
  );
}
