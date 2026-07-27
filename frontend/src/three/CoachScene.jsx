import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSpatialCoach } from '../context/useSpatialCoach';
import { CharacterRenderer } from './CharacterRenderer';
import { ParticleField } from './ParticleField';
import { AutoFramingCamera } from './AutoFramingCamera';
import { use3DThemeTokens } from './use3DThemeTokens';
import { Sparkles, Maximize2 } from 'lucide-react';

function EnergyPortal({ color }) {
  return (
    <group position={[0, 0.05, -0.4]}>
      {/* Outer Rotating Energy Ring */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.65, 0.72, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.2}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner Rotating Segmented Glow Ring */}
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[0.52, 0.58, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.5}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Soft Energy Backdrop Glow */}
      <mesh position={[0, 0, -0.05]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
        />
      </mesh>
    </group>
  );
}

export function CoachScene({ height = '420px', mini = false, isSpeaking: isSpeakingProp, isThinking: isThinkingProp }) {
  const { stepOut, isSpeaking: ctxSpeaking, isThinking: ctxThinking } = useSpatialCoach();
  // Allow a caller (e.g. a page with its own chat panel) to drive the avatar directly;
  // otherwise fall back to the shared SpatialCoachContext state.
  const isSpeaking = isSpeakingProp !== undefined ? isSpeakingProp : ctxSpeaking;
  const isThinking = isThinkingProp !== undefined ? isThinkingProp : ctxThinking;
  const themeTokens = use3DThemeTokens();

  const modelRef = useRef();
  const controlsRef = useRef();

  return (
    <div style={{ width: '100%', height }} className="relative overflow-hidden rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl transition-colors">
      {/* 3D Portal Canvas */}
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3
        }}
        camera={{ position: [0, 0, 3.0], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        {/* --- HIGH-END 3-POINT & RIM STUDIO LIGHTING --- */}
        <ambientLight intensity={1.4} />
        <hemisphereLight
          skyColor={themeTokens.skyLightColor}
          groundColor={themeTokens.groundLightColor}
          intensity={1.2}
        />
        {/* Key Light */}
        <directionalLight
          position={[3, 5, 4]}
          intensity={2.2}
          color={themeTokens.directionalLightColor}
          castShadow
        />
        {/* Fill Light */}
        <directionalLight
          position={[-3, 2, 2]}
          intensity={1.0}
          color={themeTokens.skyLightColor}
        />
        {/* Intense Rim / Backlight for specular silhouettes */}
        <directionalLight
          position={[0, 3, -4]}
          intensity={2.5}
          color={themeTokens.accentColor}
        />
        {/* Point Light Core Accent */}
        <pointLight
          position={[0, 0.3, 1.2]}
          intensity={2.0}
          color={themeTokens.pointLightColor}
        />

        <Suspense fallback={null}>
          {/* Animated Volumetric Energy Portal behind Character */}
          <EnergyPortal color={themeTokens.accentColor} />

          {/* Render Active 3D Character Model ALWAYS inside Portal Window */}
          <CharacterRenderer ref={modelRef} isSpeaking={isSpeaking} isThinking={isThinking} isOverlayMode={false} />

          {!mini && <ParticleField isSpeaking={isSpeaking} />}

          {/* Automatic Camera Framing */}
          <AutoFramingCamera targetRef={modelRef} targetCoverage={0.70} controlsRef={controlsRef} />
        </Suspense>

        {!mini && (
          <OrbitControls
            ref={controlsRef}
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 1.7}
            minPolarAngle={Math.PI / 2.5}
            maxAzimuthAngle={Math.PI / 5}
            minAzimuthAngle={-Math.PI / 5}
          />
        )}
      </Canvas>

      {/* Top Status Badge */}
      {!mini && (
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)]/90 backdrop-blur-md border border-[var(--border-color)] text-xs font-bold text-[var(--accent-primary)] shadow-md">
          <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-[var(--accent-primary)] animate-ping' : 'bg-[var(--success)]'}`}></span>
          {isSpeaking ? '3D COACH SPEAKING...' : isThinking ? '3D COACH THINKING...' : '3D PORTAL ONLINE - COACH ACTIVE'}
        </div>
      )}

      {/* Step Out Trigger Button */}
      {!mini && (
        <button
          onClick={stepOut}
          className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-xl border bg-[var(--accent-primary)] text-slate-950 border-transparent hover:scale-105 pointer-events-auto"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Step Out Spatial Mode ↗</span>
        </button>
      )}
    </div>
  );
}
