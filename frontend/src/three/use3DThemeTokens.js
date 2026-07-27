import { useState, useEffect } from 'react';
import * as THREE from 'three';

export function use3DThemeTokens() {
  const [tokens, setTokens] = useState(() => getThemeTokens());

  function safeColor(colorStr, fallbackHex) {
    try {
      if (!colorStr) return new THREE.Color(fallbackHex);
      if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
        // Extract RGB numbers
        const matches = colorStr.match(/\d+/g);
        if (matches && matches.length >= 3) {
          return new THREE.Color(`rgb(${matches[0]}, ${matches[1]}, ${matches[2]})`);
        }
      }
      return new THREE.Color(colorStr);
    } catch {
      return new THREE.Color(fallbackHex);
    }
  }

  function getThemeTokens() {
    if (typeof window === 'undefined') {
      return getDefaultTokens();
    }

    const root = document.documentElement;
    const style = getComputedStyle(root);

    const getVar = (name, fallback) => {
      const val = style.getPropertyValue(name).trim();
      return val || fallback;
    };

    const skinStr = getVar('--model-skin', '#ffffff');
    const accentStr = getVar('--accent-primary', '#00D4FF');
    const bgPrimaryStr = getVar('--bg-primary', '#0A0E1A');
    const bgSecondaryStr = getVar('--bg-secondary', '#111827');
    const textPrimaryStr = getVar('--text-primary', '#F8FAFC');
    const reflectionStr = getVar('--model-reflection', 'rgba(0, 212, 255, 0.25)');

    const skinColor = safeColor(skinStr, '#ffffff');
    const accentColor = safeColor(accentStr, '#00D4FF');
    const bgPrimaryColor = safeColor(bgPrimaryStr, '#0A0E1A');

    return {
      skinStr,
      accentStr,
      bgPrimaryStr,
      bgSecondaryStr,
      textPrimaryStr,
      reflectionStr,

      skinColor,
      accentColor,
      skyLightColor: skinColor.clone().lerp(new THREE.Color('#ffffff'), 0.5),
      groundLightColor: bgPrimaryColor,
      directionalLightColor: new THREE.Color('#ffffff'),
      pointLightColor: accentColor,
      portalRingColor: accentColor,
      particleColor: accentColor,
    };
  }

  function getDefaultTokens() {
    const skinColor = new THREE.Color('#ffffff');
    const accentColor = new THREE.Color('#00D4FF');
    return {
      skinStr: '#ffffff',
      accentStr: '#00D4FF',
      bgPrimaryStr: '#0A0E1A',
      bgSecondaryStr: '#111827',
      textPrimaryStr: '#F8FAFC',
      reflectionStr: 'rgba(0, 212, 255, 0.25)',

      skinColor,
      accentColor,
      skyLightColor: new THREE.Color('#ffffff'),
      groundLightColor: new THREE.Color('#0A0E1A'),
      directionalLightColor: new THREE.Color('#ffffff'),
      pointLightColor: accentColor,
      portalRingColor: accentColor,
      particleColor: accentColor,
    };
  }

  useEffect(() => {
    const update = () => {
      setTokens(getThemeTokens());
    };

    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    });

    return () => observer.disconnect();
  }, []);

  return tokens;
}
