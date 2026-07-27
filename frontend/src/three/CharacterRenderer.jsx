import React, { useState, useEffect, forwardRef, Component } from 'react';
import { ProceduralCoachRenderer } from './ProceduralCoachRenderer';
import { GLTFCoachRenderer } from './GLTFCoachRenderer';
import { use3DThemeTokens } from './use3DThemeTokens';

class GLTFCatchBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn("GLTF Model load failed, falling back to ProceduralCoachRenderer:", error);
    if (this.props.onError) this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return <ProceduralCoachRenderer {...this.props.fallbackProps} />;
    }
    return this.props.children;
  }
}

export const CharacterRenderer = forwardRef(function CharacterRenderer(props, ref) {
  const [glbAvailable, setGlbAvailable] = useState(false);
  const [glbChecked, setGlbChecked] = useState(false);
  const themeTokens = use3DThemeTokens();

  const modelPath = props.modelPath || '/models/coach.glb';

  // Safely check if GLB file exists on server & is NOT Vite SPA index.html fallback
  useEffect(() => {
    let active = true;
    fetch(modelPath, { method: 'HEAD' })
      .then((res) => {
        if (!active) return;
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        // If server returns HTML (SPA fallback for 404), it's NOT a GLB model file!
        if (res.ok && !contentType.includes('html') && !contentType.includes('text/plain')) {
          setGlbAvailable(true);
        } else {
          setGlbAvailable(false);
        }
      })
      .catch(() => {
        if (active) setGlbAvailable(false);
      })
      .finally(() => {
        if (active) setGlbChecked(true);
      });

    return () => {
      active = false;
    };
  }, [modelPath]);

  const combinedProps = {
    ...props,
    themeTokens,
  };

  if (!glbChecked) {
    return <ProceduralCoachRenderer ref={ref} {...combinedProps} />;
  }

  if (glbAvailable) {
    return (
      <GLTFCatchBoundary fallbackProps={combinedProps} onError={() => setGlbAvailable(false)}>
        <GLTFCoachRenderer ref={ref} modelPath={modelPath} {...combinedProps} />
      </GLTFCatchBoundary>
    );
  }

  return <ProceduralCoachRenderer ref={ref} {...combinedProps} />;
});
