import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Activity, Flame, ShieldAlert } from 'lucide-react';

export function BodyPainMap({
  selectedParts = [],
  onSelectPart,
  onTogglePart,
  painLevel = 0,
  onChangePainLevel
}) {
  const { mobileMode, isNarrowViewport } = useTheme();
  const isCompact = mobileMode || isNarrowViewport;
  const [view, setView] = useState('front'); // 'front' | 'back'

  const handleToggle = (id) => {
    if (onSelectPart) onSelectPart(id);
    if (onTogglePart) onTogglePart(id);
  };

  const handlePainChange = (val) => {
    if (onChangePainLevel) onChangePainLevel(val);
  };

  const bodyNodes = [
    { id: 'neck', name: 'Neck / Cervical', cx: 50, cy: 30, view: 'both' },
    { id: 'shoulder_left', name: 'Left Shoulder', cx: 26, cy: 45, view: 'both' },
    { id: 'shoulder_right', name: 'Right Shoulder', cx: 74, cy: 45, view: 'both' },
    { id: 'chest', name: 'Chest', cx: 50, cy: 55, view: 'front' },
    { id: 'upper_back', name: 'Upper Back / Thoracic', cx: 50, cy: 52, view: 'back' },
    { id: 'lower_back', name: 'Lower Back / Lumbar', cx: 50, cy: 75, view: 'back' },
    { id: 'elbow_left', name: 'Left Elbow', cx: 16, cy: 70, view: 'both' },
    { id: 'elbow_right', name: 'Right Elbow', cx: 84, cy: 70, view: 'both' },
    { id: 'wrist_left', name: 'Left Wrist / Hand', cx: 10, cy: 92, view: 'both' },
    { id: 'wrist_right', name: 'Right Wrist / Hand', cx: 90, cy: 92, view: 'both' },
    { id: 'hip_left', name: 'Left Hip / Pelvis', cx: 36, cy: 85, view: 'both' },
    { id: 'hip_right', name: 'Right Hip / Pelvis', cx: 64, cy: 85, view: 'both' },
    { id: 'knee_left', name: 'Left Knee', cx: 36, cy: 125, view: 'both' },
    { id: 'knee_right', name: 'Right Knee', cx: 64, cy: 125, view: 'both' },
    { id: 'ankle_left', name: 'Left Ankle / Foot', cx: 38, cy: 170, view: 'both' },
    { id: 'ankle_right', name: 'Right Ankle / Foot', cx: 62, cy: 170, view: 'both' }
  ];

  const visibleNodes = bodyNodes.filter(n => n.view === 'both' || n.view === view);

  const getPainColor = (lvl) => {
    if (lvl === 0) return 'text-[var(--text-tertiary)]';
    if (lvl <= 3) return 'text-emerald-400';
    if (lvl <= 6) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4">
      <div className={`flex ${isCompact ? 'flex-col gap-2.5' : 'items-center justify-between'}`}>
        <div className="min-w-0">
          {!isCompact && (
            <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider block">
              INTERACTIVE ANATOMICAL PAIN MAP
            </span>
          )}
          <p className="text-xs font-bold text-[var(--text-primary)]">Click Body Parts & Adjust Pain Score</p>
        </div>

        {/* Front / Back Toggle */}
        <div className={`flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] ${isCompact ? 'self-start' : ''}`}>
          <button
            type="button"
            onClick={() => setView('front')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              view === 'front' ? 'bg-[var(--accent-primary)] text-slate-950' : 'text-[var(--text-secondary)]'
            }`}
          >
            FRONT
          </button>
          <button
            type="button"
            onClick={() => setView('back')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              view === 'back' ? 'bg-[var(--accent-primary)] text-slate-950' : 'text-[var(--text-secondary)]'
            }`}
          >
            BACK
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* SVG Anatomical Map */}
        <div className="flex justify-center bg-[var(--bg-secondary)] p-3 rounded-2xl border border-[var(--border-color)] relative">
          <svg className="w-36 h-56" viewBox="0 0 100 200" fill="none">
            {/* Body Silhouette Outline */}
            <circle cx="50" cy="18" r="10" className="fill-[var(--bg-tertiary)] stroke-[var(--border-color)]" strokeWidth="1.5" />
            <path d="M 32 32 Q 50 28 68 32 L 78 70 L 68 75 L 64 105 L 56 105 L 54 185 L 46 185 L 44 105 L 36 105 L 32 75 L 22 70 Z" className="fill-[var(--bg-tertiary)] stroke-[var(--border-color)]" strokeWidth="1.5" />

            {/* Interactive Anatomical Click Nodes */}
            {visibleNodes.map((node) => {
              const isSelected = selectedParts.includes(node.id);
              return (
                <g key={node.id} onClick={() => handleToggle(node.id)} className="cursor-pointer group">
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={isSelected ? "6" : "4.5"}
                    className={`transition-all ${
                      isSelected
                        ? 'fill-rose-500 stroke-rose-300 animate-pulse'
                        : 'fill-[var(--accent-primary)] opacity-40 hover:opacity-100'
                    }`}
                    strokeWidth="1.5"
                  />
                  {isSelected && (
                    <circle cx={node.cx} cy={node.cy} r="10" className="fill-rose-500/20 animate-ping" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Side: Selected Parts + Pain Intensity Slider */}
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-[10px] text-[var(--text-secondary)] font-bold block mb-1">SELECTED ANATOMICAL LOCATIONS:</span>
            {selectedParts.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedParts.map((id) => {
                  const n = bodyNodes.find(b => b.id === id);
                  return (
                    <span key={id} className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                      {n ? n.name : id}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-[11px] text-[var(--text-tertiary)] italic">Click body points on silhouette to flag pain</span>
            )}
          </div>

          {/* 0-10 Pain Slider */}
          {onChangePainLevel && (
            <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
              <div className="flex justify-between font-bold">
                <span className="text-[var(--text-secondary)]">PAIN INTENSITY (0-10):</span>
                <span className={`font-mono text-xs ${getPainColor(painLevel)}`}>
                  {painLevel}/10 {painLevel === 0 ? '(No Pain)' : painLevel <= 3 ? '(Mild)' : painLevel <= 6 ? '(Moderate)' : '(Severe)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={painLevel}
                onChange={(e) => handlePainChange(Number(e.target.value))}
                className="w-full accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
