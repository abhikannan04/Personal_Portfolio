import { useRef, Suspense, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Preload } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";
import { useReducedMotion } from "framer-motion";
import { MathUtils } from "three";

import CanvasBoundary from "./CanvasBoundary";
import { windowPointer } from "../../hooks";

const StarLayer = ({ count, radius, color, size, speed, reduceMotion }) => {
  const ref = useRef();
  const [sphere] = useState(() =>
    random.inSphere(new Float32Array(count * 3), { radius })
  );

  useFrame((state, delta) => {
    if (!ref.current || reduceMotion) return;
    ref.current.rotation.x -= (delta / 10) * speed;
    ref.current.rotation.y -= (delta / 15) * speed;
  });

  return (
    <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};

// Scrolling flies the camera through the star field; the cursor adds parallax.
const Starfield = ({ reduceMotion }) => {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current || reduceMotion) return;

    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = window.scrollY / maxScroll;
    const group = groupRef.current;

    group.rotation.z = MathUtils.damp(group.rotation.z, Math.PI / 4 + progress * Math.PI, 2, delta);
    group.position.z = MathUtils.damp(group.position.z, progress * 0.6, 2, delta);
    group.position.x = MathUtils.damp(group.position.x, windowPointer.x * 0.05, 2, delta);
    group.position.y = MathUtils.damp(group.position.y, windowPointer.y * 0.05, 2, delta);
  });

  return (
    <group ref={groupRef} rotation={[0, 0, Math.PI / 4]}>
      <StarLayer count={1700} radius={1.2} color='#f272c8' size={0.002} speed={1} reduceMotion={reduceMotion} />
      <StarLayer count={1200} radius={1.4} color='#915EFF' size={0.0025} speed={0.6} reduceMotion={reduceMotion} />
      <StarLayer count={600} radius={1.6} color='#56ccf2' size={0.003} speed={0.4} reduceMotion={reduceMotion} />
    </group>
  );
};

const StarsCanvas = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className='w-full h-screen fixed inset-0 z-[-1] pointer-events-none'>
      <CanvasBoundary>
        <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <Starfield reduceMotion={reduceMotion} />
          </Suspense>

          <Preload all />
        </Canvas>
      </CanvasBoundary>
    </div>
  );
};

export default StarsCanvas;
