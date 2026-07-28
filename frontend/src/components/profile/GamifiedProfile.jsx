import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../redux/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { EquipmentSelector } from './EquipmentSelector';
import { ProfileEditModal } from './ProfileEditModal';
import { InjuryManager } from '../health/InjuryManager';
import {
  Trophy,
  Zap,
  Flame,
  Camera,
  Edit2,
  CheckCircle2,
  TrendingUp,
  Activity,
  Save,
  Lock,
  Unlock,
  Sparkles,
  Dumbbell,
  Ruler,
  Weight,
  Percent,
  ShieldAlert,
  Package,
  Settings2
} from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_AVATARS = [
  { id: 1, label: 'Raj (Athlete M)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
  { id: 2, label: 'Priya (Fit F)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80' },
  { id: 3, label: 'Arjun (Marathon M)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' },
  { id: 4, label: 'Maya (Strength F)', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80' },
  { id: 5, label: 'Cyber AI Coach', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80' },
  { id: 6, label: 'Futuristic Glow', url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=250&q=80' }
];

function AttributeRadar({ attributes }) {
  const stats = [
    { label: 'STR', val: attributes?.strength ?? 10 },
    { label: 'END', val: attributes?.endurance ?? 10 },
    { label: 'MOB', val: attributes?.mobility ?? 10 },
    { label: 'CON', val: attributes?.consistency ?? 5 },
    { label: 'REC', val: attributes?.recovery ?? 10 }
  ];

  const size = 200;
  const center = size / 2;
  const radius = 68;

  const getCoordinates = (val, idx) => {
    const angle = (Math.PI * 2 / stats.length) * idx - Math.PI / 2;
    const r = (val / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const points = stats.map((s, idx) => {
    const { x, y } = getCoordinates(s.val, idx);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative flex flex-col items-center max-w-full overflow-hidden my-2">
      <svg width={size} height={size} className="overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((rScale, i) => (
          <polygon
            key={i}
            points={stats.map((_, idx) => {
              const angle = (Math.PI * 2 / stats.length) * idx - Math.PI / 2;
              const r = radius * rScale;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="1"
            strokeDasharray={i < 3 ? "3,3" : "none"}
          />
        ))}

        {stats.map((_, idx) => {
          const angle = (Math.PI * 2 / stats.length) * idx - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return <line key={idx} x1={center} y1={center} x2={x2} y2={y2} stroke="var(--border-color)" strokeWidth="1" />;
        })}

        <polygon
          points={points}
          fill="rgba(59, 130, 246, 0.25)"
          stroke="var(--accent-primary)"
          strokeWidth="2.5"
          className="transition-all duration-700"
        />

        {stats.map((s, idx) => {
          const { x, y } = getCoordinates(s.val, idx);
          const angle = (Math.PI * 2 / stats.length) * idx - Math.PI / 2;
          const labelX = center + (radius + 16) * Math.cos(angle);
          const labelY = center + (radius + 12) * Math.sin(angle);

          return (
            <g key={idx}>
              <circle cx={x} cy={y} r="3.5" fill="var(--accent-primary)" />
              <text
                x={labelX}
                y={labelY}
                fill="var(--text-secondary)"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {s.label} {s.val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function GamifiedProfile() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { level, xp, xpToNextLevel, rankTitle, archetype, attributes, achievements, prHallOfFame, skillTreePerks } = useSelector(state => state.gamification);
  const { mobileMode } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || PRESET_AVATARS[0].url);
  const [equipment, setEquipment] = useState(user?.equipment || []);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        toast.success('Custom avatar uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (!name.trim()) {
      toast.error('Please enter a valid display name');
      return;
    }
    dispatch(updateProfile({
      name: name.trim(),
      avatar,
      equipment
    }));
    toast.success('RPG Profile settings updated successfully!');
  };

  const xpPercent = Math.min(100, Math.round((xp / xpToNextLevel) * 100));

  return (
    <div className="space-y-5 max-w-full overflow-hidden">
      
      {/* HERO RPG CHARACTER IDENTITY CARD */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-5 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-[var(--accent-primary)]/10 blur-3xl pointer-events-none" />

        <div className={`flex ${mobileMode ? 'flex-col items-center text-center' : 'flex-col lg:flex-row items-center lg:items-start justify-between'} gap-5 relative`}>
          
          {/* Avatar & User Details */}
          <div className={`flex ${mobileMode ? 'flex-col items-center text-center' : 'flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left'} w-full lg:w-auto`}>
            <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-[var(--accent-primary)] via-emerald-400 to-cyan-400 animate-pulse shadow-2xl">
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full rounded-full object-cover border-4 border-[var(--bg-secondary)]"
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-slate-950 font-extrabold text-[10px] sm:text-xs shadow uppercase tracking-wider whitespace-nowrap">
                  LEVEL {level} • {rankTitle}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--accent-primary)] text-[10px] sm:text-xs font-bold whitespace-nowrap">
                  {archetype?.name || 'Strength Juggernaut'}
                </span>
              </div>

              <div className="relative flex items-center max-w-xs mx-auto sm:mx-0">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-base sm:text-xl font-extrabold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors pr-7 truncate"
                />
                <Edit2 className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute right-2 pointer-events-none" />
              </div>

              <p className="text-[11px] text-[var(--text-secondary)] font-semibold truncate">
                {user?.email}
                {user?.profile?.age != null && ` • Age ${user.profile.age}`}
                {user?.profile?.weight != null && ` • ${user.profile.weight}kg`}
              </p>
            </div>
          </div>

          {/* Level XP Progress Gauge Card */}
          <div className={`w-full ${mobileMode ? 'w-full' : 'lg:w-72'} p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2.5 shadow-xl shrink-0`}>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> RANK XP PROGRESS
              </span>
              <span className="text-[var(--accent-primary)] font-mono">{xp} / {xpToNextLevel} XP</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden p-0.5 border border-[var(--border-color)]">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] font-semibold">
              <span>Lvl {level}</span>
              <span>Next: Tier {level + 1} Perk</span>
            </div>
          </div>
        </div>

        {/* Preset Avatar Selection Strip */}
        <div className={`pt-3 border-t border-[var(--border-color)] flex ${mobileMode ? 'flex-col' : 'flex-col sm:flex-row'} items-center justify-between gap-3`}>
          <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
            Avatar Presets:
          </span>
          
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 max-w-full">
            {PRESET_AVATARS.map((preset) => {
              const isSelected = avatar === preset.url;
              return (
                <button
                  key={preset.id}
                  onClick={() => setAvatar(preset.url)}
                  className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                    isSelected ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/50 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  data-ai-tip={`Click to set profile picture to ${preset.label}`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSaveProfile}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-extrabold text-xs shadow-xl flex items-center justify-center gap-1.5 transition-all shrink-0"
            data-ai-tip="Save profile settings & avatar changes"
          >
            <Save className="w-3.5 h-3.5" /> Save Profile
          </button>
        </div>
      </div>

      {/* Body Composition Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--accent-primary)]" /> BODY COMPOSITION
          </h3>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[var(--accent-glow)] hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] hover:text-slate-950 border border-[var(--accent-primary)]/30 font-extrabold text-[11px] flex items-center gap-1.5 transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>

        {user?.profile?.height == null && user?.profile?.weight == null && user?.profile?.bodyFatPercentage == null ? (
          <p className="text-xs text-[var(--text-secondary)]">No body composition data yet. Click "Edit Profile" to add your height, weight, and body fat %.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-2.5">
              <Ruler className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-bold">Height</span>
                <span className="font-extrabold text-[var(--text-primary)]">{user?.profile?.height != null ? `${user.profile.height} cm` : '--'}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-2.5">
              <Weight className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-bold">Weight</span>
                <span className="font-extrabold text-[var(--text-primary)]">{user?.profile?.weight != null ? `${user.profile.weight} kg` : '--'}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-2.5">
              <Percent className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-bold">Body Fat</span>
                <span className="font-extrabold text-[var(--text-primary)]">{user?.profile?.bodyFatPercentage != null ? `${user.profile.bodyFatPercentage}%` : '--'}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-bold">Fitness Level</span>
                <span className="font-extrabold text-[var(--text-primary)] capitalize">{user?.profile?.fitnessLevel || '--'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gear Inventory Summary + Change Gear tiles */}
      <div className={`grid grid-cols-1 ${mobileMode ? 'grid-cols-1' : 'sm:grid-cols-3'} gap-4`}>
        <div className={`${mobileMode ? 'col-span-1' : 'sm:col-span-2'} p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-3`}>
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--accent-primary)]" /> GEAR INVENTORY
          </h3>
          {equipment.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">No equipment set yet — add what you have access to so AI workouts only use gear you actually own.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {equipment.map((item) => (
                <span key={item} className="px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold capitalize">
                  {item.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveTab('equipment')}
          className="p-4 sm:p-6 rounded-3xl bg-[var(--accent-glow)] hover:bg-[var(--accent-primary)] border border-[var(--accent-primary)]/40 shadow-2xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
        >
          <Settings2 className="w-6 h-6 text-[var(--accent-primary)] group-hover:text-slate-950" />
          <span className="text-xs font-extrabold text-[var(--text-primary)] group-hover:text-slate-950">Change Gear Inventory</span>
        </button>
      </div>

      {showEditModal && <ProfileEditModal user={user} onClose={() => setShowEditModal(false)} />}

      {/* Navigation Sub-Tabs Strip (Horizontal Scroll with No Wrap) */}
      <div className="flex border-b border-[var(--border-color)] gap-3 text-xs font-extrabold overflow-x-auto scrollbar-none pb-1.5 whitespace-nowrap">
        {[
          { id: 'overview', label: 'Attribute Stats & Radar', tip: '📊 5-Axis Fitness Radar Active! Inspect STR, END, MOB, CON, REC stats.' },
          { id: 'achievements', label: 'Achievements & Records', tip: '🏆 Achievements, PR Hall of Fame, and Skill Perks — all your earned progress in one place.' },
          { id: 'equipment', label: 'Gear Inventory', tip: '🛡️ Gear Inventory Active! Manage your equipment here.' },
          { id: 'injuries', label: `Injuries (${(user?.injuries || []).filter(i => i.isActive !== false).length})`, tip: '🩹 Injury Manager Active! Manage active injuries and exercise restrictions here.' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-ai-tip={tab.tip}
            className={`pb-2 transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-extrabold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & 5-AXIS RADAR */}
      {activeTab === 'overview' && (
        <div className={`grid grid-cols-1 ${mobileMode ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-4 sm:gap-6 animate-in fade-in duration-300`}>
          
          {/* Radar Chart Visualizer */}
          <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl flex flex-col items-center justify-center space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-primary)]" /> 5-AXIS FITNESS RADAR
            </h3>
            <AttributeRadar attributes={attributes} />
          </div>

          {/* Attributes Matrix */}
          <div className={`${mobileMode ? 'col-span-1' : 'lg:col-span-2'} p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-4`}>
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" /> RPG CHARACTER ATTRIBUTE MATRIX
            </h3>

            <div className={`grid grid-cols-1 ${mobileMode ? 'grid-cols-1' : 'sm:grid-cols-2'} gap-3`}>
              {[
                { name: 'Strength (STR)', val: attributes?.strength, desc: 'Overload capacity & heavy lift performance.' },
                { name: 'Endurance (END)', val: attributes?.endurance, desc: 'High-rep fatigue resistance & stamina.' },
                { name: 'Mobility (MOB)', val: attributes?.mobility, desc: 'Joint health & range of motion.' },
                { name: 'Consistency (CON)', val: attributes?.consistency, desc: '14-day workout logging frequency & streaks.' },
                { name: 'Recovery (REC)', val: attributes?.recovery, desc: 'Wearable score based on sleep & HRV.' }
              ].map((attr, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-extrabold">
                    <span className="text-[var(--text-primary)]">{attr.name}</span>
                    <span className="text-[var(--accent-primary)] font-mono">{attr.val}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden p-0.5 border border-[var(--border-color)]">
                    <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-700" style={{ width: `${attr.val}%` }} />
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">{attr.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACHIEVEMENTS, PR HALL OF FAME & SKILL PERKS MERGED */}
      {activeTab === 'achievements' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> UNLOCKED RPG ACHIEVEMENTS & TROPHIES
              </h3>
              <span className="text-xs font-extrabold text-[var(--accent-primary)] font-mono">
                {achievements.filter(a => a.unlocked).length} / {achievements.length} UNLOCKED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden transition-all ${
                    ach.unlocked
                      ? 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
                      : 'bg-[var(--bg-tertiary)]/40 border-[var(--border-color)] opacity-60'
                  }`}
                  data-ai-tip={`Achievement: ${ach.title} - ${ach.desc}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      ach.unlocked ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      ach.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      ach.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}>
                      {ach.rarity}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[var(--text-primary)]">{ach.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{ach.desc}</p>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[var(--text-tertiary)]">
                    {ach.unlocked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Unlocked{ach.date ? ` ${ach.date}` : ''}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Locked Challenge</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" /> PERSONAL RECORD HALL OF FAME
            </h3>

            {prHallOfFame.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] italic">No personal records logged yet. Complete workouts to start building your Hall of Fame.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prHallOfFame.map((pr, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[var(--text-primary)]">{pr.exercise}</h4>
                        <p className="text-xs text-[var(--text-secondary)] font-mono">{pr.record} × {pr.reps}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {pr.diff && <span className="text-[10px] font-bold text-amber-400 block uppercase">{pr.diff}</span>}
                      <span className="text-[10px] text-[var(--text-tertiary)]">{pr.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--accent-primary)]" /> RPG SKILL TREE & PERKS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {skillTreePerks.map((perk) => (
                <div key={perk.id} className={`p-4 rounded-2xl border space-y-2 ${perk.unlocked ? 'bg-[var(--bg-tertiary)] border-[var(--border-color)]' : 'bg-[var(--bg-tertiary)]/40 border-[var(--border-color)] opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase">Requires Lvl {perk.levelReq}</span>
                    {perk.unlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-slate-500" />}
                  </div>
                  <h4 className="font-extrabold text-sm text-[var(--text-primary)]">{perk.name}</h4>
                  <p className="text-xs text-[var(--text-secondary)]">{perk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GEAR INVENTORY */}
      {activeTab === 'equipment' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-4 animate-in fade-in duration-300">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">AVAILABLE GYM / HOME EQUIPMENT</h3>
          <EquipmentSelector selected={equipment} onChange={setEquipment} />
        </div>
      )}

      {/* TAB 6: INJURIES */}
      {activeTab === 'injuries' && (
        <div className="animate-in fade-in duration-300">
          <InjuryManager />
        </div>
      )}
    </div>
  );
}
