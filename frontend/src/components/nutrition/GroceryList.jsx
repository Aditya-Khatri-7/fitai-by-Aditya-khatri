import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export function GroceryList({ items = [] }) {
  const [checked, setChecked] = useState({});

  const toggleItem = (idx) => {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleExport = async () => {
    const text = items.map(item => `- ${item}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Grocery list copied to clipboard!');
    } catch {
      // Clipboard API unavailable (e.g. no permission) — fall back to a real file download.
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fitai-grocery-list.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Grocery list downloaded!');
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[var(--accent-primary)]" /> AI-GENERATED WEEKLY GROCERY LIST
        </h3>
        <button
          onClick={handleExport}
          className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
        >
          Export List
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {items.map((item, idx) => (
          <label
            key={idx}
            className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-2.5 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={!!checked[idx]}
              onChange={() => toggleItem(idx)}
              className="rounded border-[var(--border-color)] bg-[var(--bg-secondary)] accent-[var(--accent-primary)]"
            />
            <span className={`font-semibold ${checked[idx] ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
              {item}
            </span>
            {checked[idx] && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
          </label>
        ))}
      </div>
    </div>
  );
}
