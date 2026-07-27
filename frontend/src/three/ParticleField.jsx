import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { use3DThemeTokens } from './use3DThemeTokens';

export function ParticleField({ count = 80, isSpeaking = false }) {
  const pointsRef = useRef();
  const themeTokens = use3DThemeTokens();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return pos;
  }, [count]);

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3);
    const accent = themeTokens.accentColor || new THREE.Color('#84cc16');
    const skin = themeTokens.skinColor || new THREE.Color('#ffffff');

    for (let i = 0; i < count; i++) {
      const mixedColor = i % 2 === 0 ? accent : skin;
      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;
    }
    return col;
  }, [count, themeTokens]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const speed = isSpeaking ? 0.4 : 0.15;
      pointsRef.current.rotation.y += delta * speed;
      pointsRef.current.rotation.x += delta * (speed * 0.5);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
