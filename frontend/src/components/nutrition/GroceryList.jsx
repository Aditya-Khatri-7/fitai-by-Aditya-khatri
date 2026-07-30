import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CUSTOM_ITEMS_KEY = 'fitai_grocery_custom_items';
const REMOVED_ITEMS_KEY = 'fitai_grocery_removed_items';

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// items: [{ name, totalQuantity, mealsUsedIn }] — the real backend-aggregated list.
// The user can remove any AI-computed item and add their own on top, so this is a
// genuinely editable list rather than a read-only checklist of imposed items.
export function GroceryList({ items = [] }) {
  const [checked, setChecked] = useState({});
  const [customItems, setCustomItems] = useState(() => loadJSON(CUSTOM_ITEMS_KEY, []));
  const [removedNames, setRemovedNames] = useState(() => new Set(loadJSON(REMOVED_ITEMS_KEY, [])));
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));
  }, [customItems]);

  useEffect(() => {
    localStorage.setItem(REMOVED_ITEMS_KEY, JSON.stringify(Array.from(removedNames)));
  }, [removedNames]);

  const visibleAiItems = items.filter(i => !removedNames.has(i.name.toLowerCase()));
  const allItems = [...visibleAiItems, ...customItems.map(name => ({ name, totalQuantity: '', mealsUsedIn: null, custom: true }))];

  const toggleItem = (name) => {
    setChecked(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    setCustomItems(prev => [...prev, trimmed]);
    setNewItemText('');
  };

  const handleRemoveItem = (item) => {
    if (item.custom) {
      setCustomItems(prev => prev.filter(name => name !== item.name));
    } else {
      setRemovedNames(prev => new Set([...prev, item.name.toLowerCase()]));
    }
    toast.success(`Removed ${item.name} from your list`);
  };

  const handleExport = async () => {
    const text = allItems.map(item => `- ${item.name}${item.totalQuantity ? ` (${item.totalQuantity})` : ''}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Grocery list copied to clipboard!');
    } catch {
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
          <ShoppingCart className="w-4 h-4 text-[var(--accent-primary)]" /> WEEKLY GROCERY LIST
        </h3>
        <button
          onClick={handleExport}
          className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
        >
          Export List
        </button>
      </div>

      {/* Add your own item — real brainstorming, not just checking off AI picks */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          placeholder="Add your own item (e.g. olive oil, ginger)..."
          className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
        />
        <button
          onClick={handleAddItem}
          className="px-3 py-2 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {allItems.length === 0 ? (
        <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
          No ingredients yet — generate a meal plan, or add your own items above.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {allItems.map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-2.5"
            >
              <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!checked[item.name]}
                  onChange={() => toggleItem(item.name)}
                  className="rounded border-[var(--border-color)] bg-[var(--bg-secondary)] accent-[var(--accent-primary)] shrink-0"
                />
                <span className="min-w-0">
                  <span className={`font-semibold block truncate ${checked[item.name] ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                    {item.name}
                  </span>
                  {(item.totalQuantity || item.mealsUsedIn) && (
                    <span className="text-[10px] text-[var(--text-tertiary)] block">
                      {item.totalQuantity}{item.mealsUsedIn ? ` · used in ${item.mealsUsedIn} meal${item.mealsUsedIn > 1 ? 's' : ''}` : ''}
                    </span>
                  )}
                </span>
              </label>
              {checked[item.name] && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              <button
                onClick={() => handleRemoveItem(item)}
                className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                title="Remove from list"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
