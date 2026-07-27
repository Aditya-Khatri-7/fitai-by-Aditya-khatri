import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Global mouse tracker across entire browser window
let globalMousePos = { x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 };

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    globalMousePos = { x: e.clientX, y: e.clientY };
  });
}

export const ProceduralCoachRenderer = forwardRef(function ProceduralCoachRenderer(
  {
    isSpeaking = false,
    isThinking = false,
    stepState = 'inside',
    gestureTrigger = null,
    triggerGesture = () => {},
    isOverlayMode = false,
    themeTokens = {}
  },
  ref
) {
  const mainGroup = useRef();
  const stepGroup = useRef();

  useImperativeHandle(ref, () => mainGroup.current);

  const headGroup = useRef();
  const neckGroup = useRef();
  const torsoGroup = useRef();
  const coreRef = useRef();

  // Left Arm
  const leftShoulderGroup = useRef();
  const leftLowerArmGroup = useRef();

  // Right Arm
  const rightShoulderGroup = useRef();
  const rightLowerArmGroup = useRef();

  // Left Leg
  const leftHipGroup = useRef();
  const leftKneeGroup = useRef();

  // Right Leg
  const rightHipGroup = useRef();
  const rightKneeGroup = useRef();

  // Materials
  const bodyMaterial = useRef(
    new THREE.MeshPhysicalMaterial({
      color: themeTokens.skinColor || new THREE.Color('#ffffff'),
      roughness: 0.15,
      metalness: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    })
  );

  const glowingMaterial = useRef(
    new THREE.MeshStandardMaterial({
      color: themeTokens.accentColor || new THREE.Color('#84CC16'),
      emissive: themeTokens.accentColor || new THREE.Color('#84CC16'),
      emissiveIntensity: 2.5,
      roughness: 0.2,
      toneMapped: false,
    })
  );

  const jointMaterial = useRef(
    new THREE.MeshStandardMaterial({
      color: '#333333',
      roughness: 0.7,
      metalness: 0.5,
    })
  );

  // Frame Loop & Realtime Relative Mouse Tracking Math
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const canvasPointer = state.pointer;

    // Theme Lerping
    if (bodyMaterial.current && themeTokens.skinColor) {
      bodyMaterial.current.color.lerp(themeTokens.skinColor, 0.08);
    }
    if (glowingMaterial.current && themeTokens.accentColor) {
      glowingMaterial.current.color.lerp(themeTokens.accentColor, 0.08);
      glowingMaterial.current.emissive.lerp(themeTokens.accentColor, 0.08);
    }

    // Calculate exact center of canvas on screen dynamically
    let relNormX = 0;
    let relNormY = 0;

    const trackingEnabled = typeof window !== 'undefined' && window.fitai_mouse_tracking_enabled !== false;

    if (trackingEnabled && typeof window !== 'undefined') {
      let botScreenX = window.innerWidth * (isOverlayMode ? 0.5 : 0.86);
      let botScreenY = window.innerHeight * (isOverlayMode ? 0.5 : 0.84);

      if (state.gl && state.gl.domElement) {
        const rect = state.gl.domElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          botScreenX = rect.left + rect.width / 2;
          botScreenY = rect.top + rect.height / 2;
        }
      }

      const deltaX = globalMousePos.x - botScreenX;
      const deltaY = globalMousePos.y - botScreenY;

      // Normalize relative vector
      relNormX = Math.max(-1, Math.min(1, deltaX / (window.innerWidth * 0.4)));
      relNormY = Math.max(-1, Math.min(1, -deltaY / (window.innerHeight * 0.4)));
    } else {
      relNormX = canvasPointer.x * 0.5;
      relNormY = canvasPointer.y * 0.5;
    }

    // Positioning based on step state
    let targetZ = 0.0;
    let targetY = -0.4;
    let targetScale = 1.0;

    if (isOverlayMode || stepState === 'stepped_out') {
      targetZ = 0.0;
      targetY = -0.42;
      targetScale = 1.35;
    } else if (stepState === 'climbing_out') {
      targetZ = 0.3;
      targetY = -0.2;
      targetScale = 1.2;
    } else if (stepState === 'climbing_in') {
      targetZ = 0.0;
      targetY = -0.35;
      targetScale = 1.0;
    }

    if (stepGroup.current) {
      stepGroup.current.position.z = THREE.MathUtils.lerp(stepGroup.current.position.z, targetZ, 0.08);
      stepGroup.current.position.y = THREE.MathUtils.lerp(stepGroup.current.position.y, targetY, 0.08);
      const currentScale = stepGroup.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.08);
      stepGroup.current.scale.set(nextScale, nextScale, nextScale);
    }

    // Head & Neck Rotation (Look at Mouse Cursor in Realtime)
    if (headGroup.current && neckGroup.current) {
      const targetHeadY = relNormX * 0.75;
      const targetHeadX = -relNormY * 0.55;

      headGroup.current.rotation.y = THREE.MathUtils.lerp(headGroup.current.rotation.y, targetHeadY, 0.12);
      headGroup.current.rotation.x = THREE.MathUtils.lerp(headGroup.current.rotation.x, targetHeadX, 0.12);

      neckGroup.current.rotation.y = THREE.MathUtils.lerp(neckGroup.current.rotation.y, targetHeadY * 0.4, 0.12);
      neckGroup.current.rotation.x = THREE.MathUtils.lerp(neckGroup.current.rotation.x, targetHeadX * 0.4, 0.12);
    }

    // Idle Breathing & Speaking Motion
    if (torsoGroup.current) {
      torsoGroup.current.position.y = Math.sin(time * 2) * 0.015;
    }

    // Core Orb Rotation
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.02;
      coreRef.current.rotation.x = Math.sin(time) * 0.2;
    }

    // Dynamic Arm Movements
    const breathOffset = Math.sin(time * 2) * 0.05;

    if (isSpeaking) {
      if (leftShoulderGroup.current) {
        leftShoulderGroup.current.rotation.z = 0.35 + Math.sin(time * 8) * 0.15;
        leftShoulderGroup.current.rotation.x = Math.cos(time * 6) * 0.2;
      }
      if (rightShoulderGroup.current) {
        rightShoulderGroup.current.rotation.z = -0.35 - Math.cos(time * 8) * 0.15;
        rightShoulderGroup.current.rotation.x = Math.sin(time * 6) * 0.2;
      }
    } else if (gestureTrigger === 'wave') {
      if (rightShoulderGroup.current) {
        rightShoulderGroup.current.rotation.z = -2.2 + Math.sin(time * 12) * 0.3;
        rightShoulderGroup.current.rotation.x = 0;
      }
    } else {
      if (leftShoulderGroup.current) {
        leftShoulderGroup.current.rotation.z = THREE.MathUtils.lerp(leftShoulderGroup.current.rotation.z, 0.2 + breathOffset, 0.08);
        leftShoulderGroup.current.rotation.x = THREE.MathUtils.lerp(leftShoulderGroup.current.rotation.x, 0, 0.08);
      }
      if (rightShoulderGroup.current) {
        rightShoulderGroup.current.rotation.z = THREE.MathUtils.lerp(rightShoulderGroup.current.rotation.z, -0.2 - breathOffset, 0.08);
        rightShoulderGroup.current.rotation.x = THREE.MathUtils.lerp(rightShoulderGroup.current.rotation.x, 0, 0.08);
      }
    }
  });

  return (
    <group ref={mainGroup} position={[0, 0, 0]}>
      <group ref={stepGroup}>
        {/* Torso & Core */}
        <group ref={torsoGroup} position={[0, 0.2, 0]}>
          {/* Upper Chest Armor */}
          <mesh position={[0, 0.35, 0]} material={bodyMaterial.current}>
            <cylinderGeometry args={[0.22, 0.18, 0.28, 24]} />
          </mesh>

          {/* Glowing Energy Core Orb */}
          <mesh ref={coreRef} position={[0, 0.34, 0.12]} material={glowingMaterial.current}>
            <sphereGeometry args={[0.06, 24, 24]} />
          </mesh>

          {/* Lower Abdomen */}
          <mesh position={[0, 0.14, 0]} material={jointMaterial.current}>
            <cylinderGeometry args={[0.16, 0.14, 0.18, 24]} />
          </mesh>

          {/* Hips Base */}
          <mesh position={[0, 0.01, 0]} material={bodyMaterial.current}>
            <cylinderGeometry args={[0.15, 0.17, 0.12, 24]} />
          </mesh>

          {/* Neck Joint */}
          <group ref={neckGroup} position={[0, 0.51, 0]}>
            <mesh position={[0, 0.04, 0]} material={jointMaterial.current}>
              <cylinderGeometry args={[0.06, 0.07, 0.08, 16]} />
            </mesh>

            {/* Head Sphere */}
            <group ref={headGroup} position={[0, 0.14, 0]}>
              <mesh material={bodyMaterial.current}>
                <sphereGeometry args={[0.15, 32, 32]} />
              </mesh>

              {/* Glowing Cyber Eye Visor Strip */}
              <mesh position={[0, 0.02, 0.12]} material={glowingMaterial.current}>
                <boxGeometry args={[0.2, 0.04, 0.06]} />
              </mesh>

              {/* Top Sensor Crown Node */}
              <mesh position={[0, 0.16, 0]} material={glowingMaterial.current}>
                <sphereGeometry args={[0.025, 16, 16]} />
              </mesh>
            </group>
          </group>

          {/* LEFT ARM */}
          <group ref={leftShoulderGroup} position={[-0.26, 0.42, 0]}>
            <mesh material={jointMaterial.current}>
              <sphereGeometry args={[0.065, 16, 16]} />
            </mesh>
            <mesh position={[-0.04, -0.14, 0]} material={bodyMaterial.current}>
              <cylinderGeometry args={[0.05, 0.045, 0.22, 16]} />
            </mesh>
            <group ref={leftLowerArmGroup} position={[-0.04, -0.25, 0]}>
              <mesh material={jointMaterial.current}>
                <sphereGeometry args={[0.045, 16, 16]} />
              </mesh>
              <mesh position={[0, -0.13, 0]} material={bodyMaterial.current}>
                <cylinderGeometry args={[0.04, 0.035, 0.2, 16]} />
              </mesh>
              <mesh position={[0, -0.24, 0]} material={glowingMaterial.current}>
                <sphereGeometry args={[0.04, 16, 16]} />
              </mesh>
            </group>
          </group>

          {/* RIGHT ARM */}
          <group ref={rightShoulderGroup} position={[0.26, 0.42, 0]}>
            <mesh material={jointMaterial.current}>
              <sphereGeometry args={[0.065, 16, 16]} />
            </mesh>
            <mesh position={[0.04, -0.14, 0]} material={bodyMaterial.current}>
              <cylinderGeometry args={[0.05, 0.045, 0.22, 16]} />
            </mesh>
            <group ref={rightLowerArmGroup} position={[0.04, -0.25, 0]}>
              <mesh material={jointMaterial.current}>
                <sphereGeometry args={[0.045, 16, 16]} />
              </mesh>
              <mesh position={[0, -0.13, 0]} material={bodyMaterial.current}>
                <cylinderGeometry args={[0.04, 0.035, 0.2, 16]} />
              </mesh>
              <mesh position={[0, -0.24, 0]} material={glowingMaterial.current}>
                <sphereGeometry args={[0.04, 16, 16]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* LEGS */}
        <group position={[0, -0.05, 0]}>
          {/* Left Leg */}
          <group ref={leftHipGroup} position={[-0.11, 0, 0]}>
            <mesh material={jointMaterial.current}>
              <sphereGeometry args={[0.06, 16, 16]} />
            </mesh>
            <mesh position={[0, -0.18, 0]} material={bodyMaterial.current}>
              <cylinderGeometry args={[0.06, 0.05, 0.28, 16]} />
            </mesh>
            <group ref={leftKneeGroup} position={[0, -0.32, 0]}>
              <mesh material={jointMaterial.current}>
                <sphereGeometry args={[0.05, 16, 16]} />
              </mesh>
              <mesh position={[0, -0.18, 0]} material={bodyMaterial.current}>
                <cylinderGeometry args={[0.045, 0.035, 0.28, 16]} />
              </mesh>
            </group>
          </group>

          {/* Right Leg */}
          <group ref={rightHipGroup} position={[0.11, 0, 0]}>
            <mesh material={jointMaterial.current}>
              <sphereGeometry args={[0.06, 16, 16]} />
            </mesh>
            <mesh position={[0, -0.18, 0]} material={bodyMaterial.current}>
              <cylinderGeometry args={[0.06, 0.05, 0.28, 16]} />
            </mesh>
            <group ref={rightKneeGroup} position={[0, -0.32, 0]}>
              <mesh material={jointMaterial.current}>
                <sphereGeometry args={[0.05, 16, 16]} />
              </mesh>
              <mesh position={[0, -0.18, 0]} material={bodyMaterial.current}>
                <cylinderGeometry args={[0.045, 0.035, 0.28, 16]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Holographic Base Ring Platform */}
        <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glowingMaterial.current}>
          <ringGeometry args={[0.3, 0.38, 32]} />
        </mesh>
        <mesh position={[0, -0.625, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 32]} />
          <meshBasicMaterial color={themeTokens.accentColor || '#84CC16'} transparent opacity={0.2} />
        </mesh>
      </group>
    </group>
  );
});
