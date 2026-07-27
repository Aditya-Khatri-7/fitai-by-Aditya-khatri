import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function AutoFramingCamera({ targetRef, targetCoverage = 0.70, controlsRef }) {
  const { camera, size } = useThree();
  const desiredPos = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(() => {
    if (!targetRef || !targetRef.current) return;

    // 1. Calculate Bounding Box of model
    const box = new THREE.Box3().setFromObject(targetRef.current);
    if (box.isEmpty()) return;

    const min = box.min;
    const max = box.max;

    // Size & center
    const height = max.y - min.y;
    const width = max.x - min.x;
    const center = new THREE.Vector3();
    box.getCenter(center);

    if (height <= 0) return;

    // 2. Compute camera distance based on vertical FOV & desired viewport coverage (65-75%)
    const fovRad = (camera.fov * Math.PI) / 180;
    const aspect = size.width / size.height;

    // Coverage calculation: character height in camera space should take targetCoverage of frustum height
    const verticalDistance = (height / 2) / Math.tan(fovRad / 2) / targetCoverage;
    const horizontalDistance = (width / 2) / Math.tan((fovRad * aspect) / 2) / targetCoverage;
    const distance = Math.max(verticalDistance, horizontalDistance, 1.8);

    // Desired camera target (centered slightly towards chest/upper body)
    desiredTarget.current.set(center.x, center.y, center.z);
    
    // Desired camera position
    desiredPos.current.set(center.x, center.y, center.z + distance);

    // 3. Smoothly lerp camera position & controls target
    if (!initialized.current) {
      camera.position.copy(desiredPos.current);
      if (controlsRef && controlsRef.current) {
        controlsRef.current.target.copy(desiredTarget.current);
      }
      initialized.current = true;
    } else {
      camera.position.lerp(desiredPos.current, 0.08);
      if (controlsRef && controlsRef.current) {
        controlsRef.current.target.lerp(desiredTarget.current, 0.08);
        controlsRef.current.update();
      } else {
        camera.lookAt(desiredTarget.current);
      }
    }
  });

  return null;
}
