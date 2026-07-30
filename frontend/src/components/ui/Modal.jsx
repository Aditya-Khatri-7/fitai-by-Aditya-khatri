import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Reusable dialog: bottom-sheet on mobile (items-end, rounded top only), centered
// card on desktop (items-center, rounded all corners). `nested` bumps z-index for
// dialogs opened from within another dialog (e.g. "Report Injury" inside the
// Injury Manager modal) so stacking order is unambiguous.
export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl', nested = false }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const zClass = nested ? 'z-[70]' : 'z-[60]';

  return (
    <div className={`fixed inset-0 ${zClass} flex items-end sm:items-center justify-center`}>
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        className={`relative w-full ${maxWidth} bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-300`}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-4 sm:p-5 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] rounded-t-3xl">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)] min-w-0 truncate">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
