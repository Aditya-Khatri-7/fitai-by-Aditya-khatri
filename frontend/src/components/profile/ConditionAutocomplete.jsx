import React, { useState, useRef, useEffect } from 'react';
import conditionsData from '../../data/conditionsList.json';
import { Search, X, Check, Activity } from 'lucide-react';

export function ConditionAutocomplete({
  selectedConditions = [],
  onChange,
  onSelectCondition,
  onRemoveCondition
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef();

  const filtered = query.trim() === ''
    ? conditionsData.slice(0, 8)
    : conditionsData.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (cond) => {
    if (onSelectCondition) {
      onSelectCondition(cond);
    } else if (onChange) {
      const condName = typeof cond === 'string' ? cond : cond.name;
      if (!selectedConditions.some(s => (typeof s === 'string' ? s : s.name) === condName)) {
        onChange([...selectedConditions, condName]);
      }
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleRemove = (cond) => {
    if (onRemoveCondition) {
      onRemoveCondition(cond);
    } else if (onChange) {
      const condName = typeof cond === 'string' ? cond : cond.name;
      onChange(selectedConditions.filter(s => (typeof s === 'string' ? s : s.name) !== condName));
    }
  };

  return (
    <div ref={containerRef} className="space-y-2 relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          placeholder="e.g. ACL, Sciatica, Rotator Cuff, Hypertension, Disc Bulge..."
          className="w-full p-3 pl-10 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-medium focus:outline-none focus:border-[var(--accent-primary)] transition-all shadow-inner"
        />
        <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-3.5" />
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-1 p-2 animate-in fade-in duration-150">
          {filtered.length > 0 ? (
            filtered.map((cond) => {
              const isSelected = selectedConditions.some(s => (typeof s === 'string' ? s : s.name) === cond.name);
              return (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => handleSelect(cond)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold'
                      : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>{cond.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] font-mono">
                    {cond.category}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-[var(--text-tertiary)]">
              No matching medical conditions found. Free-text AI intake will parse your custom description!
            </div>
          )}
        </div>
      )}

      {/* Selected Condition Badges */}
      {selectedConditions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedConditions.map((cond, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <span>{typeof cond === 'string' ? cond : cond.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(cond)}
                className="p-0.5 hover:text-rose-400 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
