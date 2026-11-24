import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

// Resolves once the hero character's shaders are compiled. The preloader
// waits for it, so the one-off compile stall happens behind the loading
// screen instead of as a freeze after the page appears.
let resolveReady;
export const sceneReady = new Promise((resolve) => (resolveReady = resolve));

// Compiles every material in the scene up front (even while the canvas is
// paused off screen), so nothing stalls the first time it's scrolled to.
// Render inside the scene's <Suspense> so it runs once assets are loaded.
export const WarmUp = ({ signal = false }) => {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    gl.compile(scene, camera);
    if (signal) resolveReady();
  }, [gl, scene, camera, signal]);

  return null;
};

// Canvas onCreated: skip three.js's shader error checks, which are only
// useful in development and force the browser to wait on every shader.
export const fastGL = ({ gl }) => {
  gl.debug.checkShaderErrors = false;
};
