import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

export const GLTFCoachRenderer = forwardRef(function GLTFCoachRenderer(
  {
    modelPath = '/models/coach.glb',
    exerciseSlug = null,
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
  useImperativeHandle(ref, () => mainGroup.current);

  const { scene, animations } = useGLTF(modelPath);
  const { actions, names } = useAnimations(animations, mainGroup);

  // Clone scene so multiple instances don't share material mutations
  const clonedScene = React.useMemo(() => scene.clone(true), [scene]);

  // Apply Theme Tokens to GLTF Materials
  useEffect(() => {
    if (!clonedScene) return;

    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material.name && child.material.name.toLowerCase().includes('accent')) {
          if (themeTokens.accentColor) {
            child.material.color.lerp(themeTokens.accentColor, 0.5);
            if (child.material.emissive) {
              child.material.emissive.lerp(themeTokens.accentColor, 0.5);
            }
          }
        }
      }
    });
  }, [clonedScene, themeTokens]);

  // Animation State Controller
  useEffect(() => {
    if (!actions || names.length === 0) return;

    Object.values(actions).forEach((action) => action?.fadeOut(0.3));

    let activeClipName = names[0]; // Default idle

    if (exerciseSlug && names.includes(exerciseSlug)) {
      activeClipName = exerciseSlug;
    } else if (gestureTrigger && names.includes(gestureTrigger)) {
      activeClipName = gestureTrigger;
    } else if (isSpeaking && names.includes('talk')) {
      activeClipName = 'talk';
    } else if (isThinking && names.includes('think')) {
      activeClipName = 'think';
    } else if (stepState === 'climbing_out' && names.includes('climb')) {
      activeClipName = 'climb';
    }

    const currentAction = actions[activeClipName] || actions[names[0]];
    if (currentAction) {
      currentAction.reset().fadeIn(0.3).play();
    }
  }, [actions, names, isSpeaking, isThinking, stepState, gestureTrigger, exerciseSlug]);

  // Position & Step-Out Frame Lerping
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

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
    }

    if (mainGroup.current) {
      mainGroup.current.position.z = THREE.MathUtils.lerp(mainGroup.current.position.z, targetZ, 0.08);
      mainGroup.current.position.y = THREE.MathUtils.lerp(mainGroup.current.position.y, targetY, 0.08);
      const cur = mainGroup.current.scale.x;
      const next = THREE.MathUtils.lerp(cur, targetScale, 0.08);
      mainGroup.current.scale.set(next, next, next);

      if (names.length === 0) {
        mainGroup.current.position.y += Math.sin(time * 2) * 0.002;
      }
    }
  });

  return (
    <group
      ref={mainGroup}
      onClick={(e) => {
        e.stopPropagation();
        triggerGesture('wave');
      }}
    >
      <primitive object={clonedScene} />
    </group>
  );
});
