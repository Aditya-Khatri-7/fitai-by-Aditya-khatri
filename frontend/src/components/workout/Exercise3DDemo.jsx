import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CharacterRenderer } from '../../three/CharacterRenderer';
import { AutoFramingCamera } from '../../three/AutoFramingCamera';
import { use3DThemeTokens } from '../../three/use3DThemeTokens';
import { getExerciseSlug, getExerciseMetadata, hasRealAnimation } from '../../utils/exerciseSlugMap';
import { toSteps } from '../../utils/exerciseSteps';
import { useSpeech } from '../../hooks/useSpeech';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Target,
  ShieldCheck,
  Activity,
  Layers,
  Repeat,
  Eye,
  ListOrdered
} from 'lucide-react';
import toast from 'react-hot-toast';

// Interactive Camera Rig for Angle Presets
function CameraRig({ cameraPreset, controlsRef, modelRef }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 3.2));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (cameraPreset === 'side') {
      targetPos.current.set(3.2, 0, 0);
    } else if (cameraPreset === 'rear') {
      targetPos.current.set(0, 0, -3.2);
    } else if (cameraPreset === 'top') {
      targetPos.current.set(0, 3.2, 0.5);
    } else {
      // Front
      targetPos.current.set(0, 0, 3.2);
    }
  }, [cameraPreset]);

  useFrame(() => {
    if (camera) {
      camera.position.lerp(targetPos.current, 0.08);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, 0.08);
        controlsRef.current.update();
      }
    }
  });

  return null;
}

export function Exercise3DDemo({ exercise, isOpen, onClose }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [cameraPreset, setCameraPreset] = useState('front'); // 'front' | 'side' | 'rear' | 'top'
  const [isMuted, setIsMuted] = useState(false);

  const themeTokens = use3DThemeTokens();
  const modelRef = useRef();
  const controlsRef = useRef();
  const { speak: speakUtterance } = useSpeech();

  if (!isOpen || !exercise) return null;

  const slug = getExerciseSlug(exercise.name);
  const animationAvailable = hasRealAnimation(exercise.name);
  const metadata = getExerciseMetadata(exercise.name);
  const steps = toSteps(exercise.instructions);

  // Prefer the exercise's own real muscleGroups (from the ML recommender / user's
  // actual workout data) over the generic slug-catalog placeholder text, which only
  // covers ~14 exercises out of the ~2,900 the recommender can return.
  const primaryMuscles = exercise.muscleGroups?.primary?.length ? exercise.muscleGroups.primary : metadata.primaryMuscles;
  const secondaryMuscles = exercise.muscleGroups?.secondary?.length ? exercise.muscleGroups.secondary : metadata.secondaryMuscles;

  const speakGuidance = () => {
    const text = `${exercise.name}. ${metadata.executionTip} AI guidance: ${metadata.aiGuidance}`;
    if (speakUtterance(text)) toast.success("Playing AI Voice Guidance");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden text-[var(--text-primary)]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider">
                  {animationAvailable ? '3D MOTION STUDIO ONLINE' : 'ANIMATION COMING SOON'}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase">{metadata.difficulty}</span>
              </div>
              <h3 className="text-xl font-extrabold mt-0.5 text-[var(--text-primary)]">{exercise.name}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Viewport & Control Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Center 3D Viewport (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="h-[360px] w-full rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] relative overflow-hidden shadow-inner flex items-center justify-center">
              <Canvas
                gl={{
                  antialias: true,
                  alpha: true,
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 1.3
                }}
                camera={{ position: [0, 0, 3.2], fov: 45 }}
                style={{ background: 'transparent' }}
              >
                <ambientLight intensity={1.3} />
                <hemisphereLight
                  skyColor={themeTokens.skyLightColor}
                  groundColor={themeTokens.groundLightColor}
                  intensity={1.1}
                />
                <directionalLight position={[3, 5, 4]} intensity={2.0} color={themeTokens.directionalLightColor} castShadow />
                <directionalLight position={[-3, 2, -2]} intensity={1.0} color={themeTokens.accentColor} />
                <pointLight position={[0, 0.5, 1.5]} intensity={1.8} color={themeTokens.pointLightColor} />

                <Suspense fallback={null}>
                  <group position={[0, 0, -0.4]}>
                    <mesh position={[0, 0.05, 0]}>
                      <ringGeometry args={[0.65, 0.72, 48]} />
                      <meshStandardMaterial
                        color={themeTokens.accentColor}
                        emissive={themeTokens.accentColor}
                        emissiveIntensity={1.8}
                        transparent
                        opacity={0.8}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  </group>

                  {/* Character Renderer */}
                  <CharacterRenderer
                    ref={modelRef}
                    exerciseSlug={slug}
                    isSpeaking={isPlaying}
                    gestureTrigger={isPlaying ? 'wave' : null}
                    isOverlayMode={false}
                  />

                  {/* Dynamic Camera Angle Presets & Bounds Framing */}
                  <CameraRig cameraPreset={cameraPreset} controlsRef={controlsRef} modelRef={modelRef} />
                  <AutoFramingCamera targetRef={modelRef} targetCoverage={0.70} controlsRef={controlsRef} />
                </Suspense>

                <OrbitControls ref={controlsRef} enableZoom={true} enablePan={false} />
              </Canvas>

              {/* Status Badge Overlay */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-[var(--bg-tertiary)]/90 backdrop-blur-md border border-[var(--border-color)] text-[10px] font-bold text-[var(--accent-primary)] flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping"></span>
                <span>{isPlaying ? 'ANIMATION PLAYING' : 'PAUSED'} • {speed}x</span>
              </div>
            </div>

            {/* Viewport Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs">
              
              {/* Playback & Speed Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-bold hover:opacity-90 transition-opacity shadow"
                  title={isPlaying ? "Pause Motion" : "Play Motion"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  onClick={() => { setIsPlaying(false); setTimeout(() => setIsPlaying(true), 50); }}
                  className="p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
                  title="Restart Animation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 border-l border-[var(--border-color)] pl-2">
                  {[0.5, 1.0, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        speed === s
                          ? 'bg-[var(--accent-primary)] text-slate-950'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Presets */}
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[var(--text-tertiary)] mr-1" />
                {['front', 'side', 'rear', 'top'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCameraPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      cameraPreset === preset
                        ? 'bg-[var(--accent-primary)] text-slate-950'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Right Information & AI Guidance Panel (1 col) */}
          <div className="space-y-4 flex flex-col justify-between">
            
            {/* Target Muscles */}
            <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> TARGET MUSCLE GROUPS
              </span>
              
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-semibold block">Primary:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {primaryMuscles.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold text-[10px] border border-[var(--border-color)] capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {secondaryMuscles.length > 0 && (
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-semibold block">Secondary / Stabilizers:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {secondaryMuscles.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium text-[10px] border border-[var(--border-color)] capitalize">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Execution Tip */}
            <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> BIOMECHANICAL EXECUTION TIP
              </span>
              <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
                {metadata.executionTip}
              </p>
            </div>

            {/* AI Guidance Box & Voice Synthesis */}
            <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI ADAPTIVE REASONING
                </span>
                <button
                  onClick={speakGuidance}
                  className="p-1.5 rounded-lg bg-[var(--accent-glow)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-slate-950 transition-colors"
                  title="Listen to AI Voice Guidance"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[var(--text-primary)] leading-relaxed font-medium">
                {metadata.aiGuidance}
              </p>
            </div>

          </div>

        </div>

        {/* Real step-by-step instructions — the fallback the user actually gets when
            no specific rigged animation exists for this exercise (the vast majority
            of the ~2,900 real recommender exercises), instead of just a generic
            idle/wave gesture with no other guidance. */}
        {steps.length > 0 && (
          <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              {animationAvailable ? 'HOW TO PERFORM' : 'HOW TO PERFORM (no 3D animation for this exercise yet — real steps below)'}
            </span>
            <ol className="space-y-1.5 text-xs">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[var(--text-secondary)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

      </div>
    </div>
  );
}
