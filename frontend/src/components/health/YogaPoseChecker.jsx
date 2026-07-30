import React, { useRef, useState } from 'react';
import { Flower2, Camera, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { fileToResizedBase64 } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

const POSE_LABELS = {
  downdog: 'Downward Dog', goddess: 'Goddess Pose', plank: 'Plank',
  tree: 'Tree Pose', warrior2: 'Warrior II'
};

// Real MobileNetV2 transfer-learning classifier trained on the yoga DATASET
// (5 poses, ~1550 real photos, 90% held-out test accuracy) — see
// ml/training/train_yoga_model.py. A 5-pose scope, not general pose detection.
export function YogaPoseChecker() {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const image_base64 = await fileToResizedBase64(file);
      const { data } = await api.post('/ml/yoga-pose', { image_base64 });
      if (data.error) toast.error(data.error);
      else setResult(data);
    } catch {
      toast.error('Could not analyze that photo — try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-3">
      <div className="flex items-center gap-2">
        <Flower2 className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Pose Check (Beta — 5 poses)</h3>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {loading ? 'Analyzing pose...' : 'Photograph Your Pose'}
      </button>

      {result && (
        <div className="pt-2 space-y-1.5">
          <p className="text-sm">
            <span className="font-extrabold text-[var(--text-primary)]">{POSE_LABELS[result.pose] || result.pose}</span>
            <span className="text-[var(--accent-primary)] font-mono text-[11px] ml-2">{Math.round(result.confidence * 100)}%</span>
          </p>
          <div className="space-y-1">
            {result.top3.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                <span>{POSE_LABELS[p.pose] || p.pose}</span>
                <span className="font-mono">{Math.round(p.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-[var(--text-tertiary)]">Recognizes: {Object.values(POSE_LABELS).join(', ')}.</p>
    </div>
  );
}
