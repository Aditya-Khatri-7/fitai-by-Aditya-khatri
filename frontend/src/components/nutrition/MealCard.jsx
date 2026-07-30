import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { regenerateSingleMealRemote, setMealConsumedRemote, fetchMealAlternatives, setMealManualRemote } from '../../redux/slices/nutritionSlice';
import { useTheme } from '../../context/ThemeContext';
import { Utensils, Clock, RefreshCw, AlertTriangle, CheckCircle2, Circle, ListChecks, PenLine, X, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fileToResizedBase64 } from '../../utils/imageUtils';

const emptyCustomFood = { name: '', quantity: '1 serving', calories: '', protein: '', carbs: '', fat: '' };

export function MealCard({ meal, mealPlanId }) {
  const dispatch = useDispatch();
  const { mobileMode, isNarrowViewport } = useTheme();
  const isCompact = mobileMode || isNarrowViewport;
  const [swapping, setSwapping] = useState(false);
  const [togglingConsumed, setTogglingConsumed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState('choose'); // 'choose' | 'custom'
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [options, setOptions] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customFood, setCustomFood] = useState(emptyCustomFood);
  const [savingCustom, setSavingCustom] = useState(false);
  const [photoPredicting, setPhotoPredicting] = useState(false);
  const [photoResult, setPhotoResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!meal) return null;

  const handleSwap = async () => {
    if (!mealPlanId) return;
    setSwapping(true);
    const result = await dispatch(regenerateSingleMealRemote({ mealPlanId, mealType: meal.type }));
    setSwapping(false);
    if (regenerateSingleMealRemote.fulfilled.match(result)) {
      toast.success(`Swapped your ${meal.type}!`);
    } else {
      toast.error(result.payload || 'Failed to swap meal');
    }
  };

  const openPicker = async () => {
    setPickerOpen(true);
    setPickerTab('choose');
    setPhotoResult(null);
    setCustomName('');
    setCustomFood(emptyCustomFood);
    setLoadingOptions(true);
    const result = await dispatch(fetchMealAlternatives({ mealType: meal.type }));
    setLoadingOptions(false);
    if (fetchMealAlternatives.fulfilled.match(result)) {
      setOptions(result.payload);
    } else {
      toast.error(result.payload || 'Failed to load options');
    }
  };

  const handleSelectOption = async (option) => {
    if (!mealPlanId) return;
    setSelecting(true);
    const result = await dispatch(setMealManualRemote({ mealPlanId, mealType: meal.type, option }));
    setSelecting(false);
    if (setMealManualRemote.fulfilled.match(result)) {
      toast.success(`Set your ${meal.type} to ${option.name}`);
      setPickerOpen(false);
    } else {
      toast.error(result.payload || 'Failed to set meal');
    }
  };

  const handleSaveCustom = async () => {
    if (!mealPlanId) return;
    const calories = Number(customFood.calories);
    if (!customName.trim() || !calories) {
      toast.error('Enter a meal name and calorie count.');
      return;
    }
    setSavingCustom(true);
    const customMeal = {
      name: customName.trim(),
      prepTime: 5,
      foods: [{
        name: customFood.name.trim() || customName.trim(),
        quantity: customFood.quantity || '1 serving',
        calories,
        protein: Number(customFood.protein) || 0,
        carbs: Number(customFood.carbs) || 0,
        fat: Number(customFood.fat) || 0
      }]
    };
    const result = await dispatch(setMealManualRemote({ mealPlanId, mealType: meal.type, customMeal }));
    setSavingCustom(false);
    if (setMealManualRemote.fulfilled.match(result)) {
      toast.success(`Logged your own ${meal.type}!`);
      setPickerOpen(false);
      setCustomName('');
      setCustomFood(emptyCustomFood);
    } else {
      toast.error(result.payload || 'Failed to save your meal');
    }
  };

  const handlePhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoPredicting(true);
    setPhotoResult(null);
    try {
      const image_base64 = await fileToResizedBase64(file);
      const { data } = await api.post('/ml/meal-photo', { image_base64 });
      if (data.error) {
        toast.error(data.error);
      } else {
        setPhotoResult(data);
        const grams = 250;
        const scale = grams / 100;
        const n = data.nutrition;
        setCustomName(data.dish.replace(/\b\w/g, c => c.toUpperCase()));
        setCustomFood({
          name: data.dish,
          quantity: `${grams}g`,
          calories: n ? Math.round(n.calories_per_100g * scale) : '',
          protein: n ? Math.round(n.protein_g * scale) : '',
          carbs: n ? Math.round(n.carbs_g * scale) : '',
          fat: n ? Math.round(n.fat_g * scale) : ''
        });
      }
    } catch {
      toast.error('Could not analyze that photo — try again or log manually.');
    } finally {
      setPhotoPredicting(false);
    }
  };

  const handleToggleConsumed = async () => {
    if (!mealPlanId) return;
    setTogglingConsumed(true);
    const result = await dispatch(setMealConsumedRemote({ mealPlanId, mealType: meal.type, consumed: !meal.consumed }));
    setTogglingConsumed(false);
    if (setMealConsumedRemote.fulfilled.match(result)) {
      toast.success(meal.consumed ? `Unmarked ${meal.type} as eaten` : `Logged ${meal.type} as eaten — progress updated!`);
    } else {
      toast.error(result.payload || 'Failed to update meal status');
    }
  };

  return (
    <div className={`p-5 rounded-2xl bg-[var(--bg-secondary)] border shadow-xl space-y-4 transition-all ${
      meal.consumed ? 'border-emerald-500/40' : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]'
    }`}>
      <div className={`flex ${isCompact ? 'flex-col gap-3' : 'items-center justify-between'} pb-3 border-b border-[var(--border-color)]`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleToggleConsumed}
            disabled={togglingConsumed || !mealPlanId}
            title={meal.consumed ? 'Mark as not eaten' : 'Mark as eaten'}
            className="shrink-0 disabled:opacity-50"
          >
            {meal.consumed ? (
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            ) : (
              <Circle className="w-9 h-9 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors" />
            )}
          </button>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">{meal.type}</span>
            <h4 className="text-sm font-bold text-[var(--text-primary)] break-words">{meal.name}</h4>
            {meal.consumed && <span className="text-[10px] text-emerald-400 font-semibold">✓ Logged as eaten</span>}
          </div>
        </div>

        <div className={`flex items-start gap-3 ${isCompact ? 'justify-between' : ''}`}>
          <div className={isCompact ? 'text-left' : 'text-right'}>
            <span className="text-sm font-extrabold text-[var(--text-primary)] font-mono">{meal.totalCalories} kcal</span>
            <span className={`text-[11px] text-[var(--text-secondary)] flex items-center gap-1 ${isCompact ? 'justify-start' : 'justify-end'}`}>
              <Clock className="w-3 h-3" /> {meal.prepTime} Mins Prep
            </span>
          </div>
          {mealPlanId && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleSwap}
                disabled={swapping}
                title="AI Swap — let the model pick a replacement"
                className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--accent-glow)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${swapping ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={openPicker}
                title="Choose manually — pick from options or log your own"
                className="px-2.5 py-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--accent-glow)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] transition-all text-[10px] font-bold flex items-center gap-1 whitespace-nowrap"
              >
                <ListChecks className="w-3.5 h-3.5" /> Choose
              </button>
            </div>
          )}
        </div>
      </div>

      {pickerOpen && (
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--accent-primary)]/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1 text-[10px] font-bold">
              <button
                onClick={() => setPickerTab('choose')}
                className={`px-3 py-1 rounded-md flex items-center gap-1 ${pickerTab === 'choose' ? 'bg-[var(--accent-primary)] text-slate-950' : 'text-[var(--text-secondary)]'}`}
              >
                <ListChecks className="w-3 h-3" /> Pick a Meal
              </button>
              <button
                onClick={() => setPickerTab('custom')}
                className={`px-3 py-1 rounded-md flex items-center gap-1 ${pickerTab === 'custom' ? 'bg-[var(--accent-primary)] text-slate-950' : 'text-[var(--text-secondary)]'}`}
              >
                <PenLine className="w-3 h-3" /> Log My Own
              </button>
              <button
                onClick={() => setPickerTab('photo')}
                className={`px-3 py-1 rounded-md flex items-center gap-1 ${pickerTab === 'photo' ? 'bg-[var(--accent-primary)] text-slate-950' : 'text-[var(--text-secondary)]'}`}
              >
                <Camera className="w-3 h-3" /> Log by Photo
              </button>
            </div>
            <button onClick={() => setPickerOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {pickerTab === 'choose' ? (
            loadingOptions ? (
              <p className="text-[11px] text-[var(--text-tertiary)] py-2">Loading options...</p>
            ) : options.length === 0 ? (
              <p className="text-[11px] text-[var(--text-tertiary)] py-2">No alternatives found for this meal slot.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(opt)}
                    disabled={selecting}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-left transition-all disabled:opacity-50"
                  >
                    <p className="text-xs font-bold text-[var(--text-primary)]">{opt.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                      {opt.foods.reduce((s, f) => s + (f.calories || 0), 0)} kcal · {opt.prepTime} min prep
                    </p>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-2">
              {pickerTab === 'photo' && (
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-dashed border-[var(--border-color)] space-y-2">
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelected} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoPredicting}
                    className="w-full py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {photoPredicting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    {photoPredicting ? 'Analyzing photo...' : 'Take or Upload a Photo'}
                  </button>
                  {photoResult && (
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      Guess: <strong className="text-[var(--text-primary)]">{photoResult.dish}</strong> ({Math.round(photoResult.confidence * 100)}% confidence) —
                      review the fields below before saving. <span className="text-amber-400">{photoResult.beta_note}</span>
                    </p>
                  )}
                </div>
              )}
              <input
                type="text"
                placeholder="Meal name (e.g. Homemade Chicken Salad)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <input
                type="text"
                placeholder="Quantity (e.g. 1 bowl, 250g)"
                value={customFood.quantity}
                onChange={(e) => setCustomFood(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <div className="grid grid-cols-4 gap-2">
                <input type="number" placeholder="Calories*" value={customFood.calories} onChange={(e) => setCustomFood(prev => ({ ...prev, calories: e.target.value }))} className="px-2 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                <input type="number" placeholder="Protein g" value={customFood.protein} onChange={(e) => setCustomFood(prev => ({ ...prev, protein: e.target.value }))} className="px-2 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                <input type="number" placeholder="Carbs g" value={customFood.carbs} onChange={(e) => setCustomFood(prev => ({ ...prev, carbs: e.target.value }))} className="px-2 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                <input type="number" placeholder="Fat g" value={customFood.fat} onChange={(e) => setCustomFood(prev => ({ ...prev, fat: e.target.value }))} className="px-2 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
              </div>
              <button
                onClick={handleSaveCustom}
                disabled={savingCustom}
                className="w-full py-2 rounded-lg bg-[var(--accent-primary)] text-slate-950 font-bold text-xs disabled:opacity-60"
              >
                {savingCustom ? 'Saving...' : `Log This as My ${meal.type}`}
              </button>
            </div>
          )}
        </div>
      )}

      {meal.timingNote?.concern && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2 text-[11px]">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold">{meal.timingNote.reason}</p>
            <p className="text-amber-400/80 mt-0.5">{meal.timingNote.suggestion}</p>
          </div>
        </div>
      )}

      {/* Foods Table */}
      <div className="space-y-2 text-xs">
        {meal.foods.map((food, idx) => (
          <div key={idx} className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
            <div>
              <span className="font-bold text-[var(--text-primary)]">{food.name}</span>
              <span className="text-[var(--text-secondary)] text-[11px] block">{food.quantity}</span>
            </div>
            <div className="text-right font-mono text-[11px] text-[var(--text-secondary)]">
              <span>{food.calories} cal</span>
              <span className="text-[var(--text-tertiary)] block">P:{food.protein}g | C:{food.carbs}g | F:{food.fat}g</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
