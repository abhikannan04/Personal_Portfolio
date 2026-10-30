import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { CatmullRomCurve3, MathUtils, Vector3 } from "three";

import CanvasBoundary from "./CanvasBoundary";
import { useInView } from "../../hooks";

const TURNS = 3;
const HEIGHT = 9;
const RADIUS = 1.4;
const TUBE_SEGMENTS = 400;
const RADIAL_SEGMENTS = 12;

const helixPoint = (t, phase) => {
  const angle = t * TURNS * Math.PI * 2 + phase;
  return new Vector3(Math.cos(angle) * RADIUS, HEIGHT / 2 - t * HEIGHT, Math.sin(angle) * RADIUS);
};

// Scroll progress through `sectionRef`: 0 when it enters, 1 when it leaves.
const sectionProgress = (element) => {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const vh = window.innerHeight;
  return MathUtils.clamp((vh * 0.6 - rect.top) / rect.height, 0, 1);
};

const Strand = ({ phase, color, progressRef }) => {
  const meshRef = useRef();
  const curve = useMemo(
    () => new CatmullRomCurve3(Array.from({ length: 120 }, (_, i) => helixPoint(i / 119, phase))),
    [phase]
  );

  // Reveal the tube progressively by limiting how many indices are drawn.
  useFrame(() => {
    const geometry = meshRef.current?.geometry;
    if (!geometry?.index) return;
    const segments = Math.floor(progressRef.current * TUBE_SEGMENTS);
    geometry.setDrawRange(0, segments * RADIAL_SEGMENTS * 6);
  });

  return (
    <mesh ref={meshRef}>
      <tubeGeometry args={[curve, TUBE_SEGMENTS, 0.05, RADIAL_SEGMENTS, false]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
    </mesh>
  );
};

const Milestones = ({ count, progressRef }) => {
  const refs = useRef([]);

  useFrame((state, delta) => {
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const reached = progressRef.current >= (i + 0.5) / count;
      const target = reached ? 1 : 0.35;
      const s = MathUtils.damp(mesh.scale.x, target, 6, delta);
      mesh.scale.setScalar(s);
      mesh.material.emissiveIntensity = MathUtils.damp(mesh.material.emissiveIntensity, reached ? 2.5 : 0.3, 6, delta);
    });
  });

  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const a = helixPoint(t, 0);
    const b = helixPoint(t, Math.PI);
    return (
      <group key={i}>
        {/* Rung joining the two strands */}
        <mesh position={a.clone().add(b).multiplyScalar(0.5)} rotation={[0, -Math.atan2(b.z - a.z, b.x - a.x), Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, a.distanceTo(b), 8]} />
          <meshStandardMaterial color='#ffffff' transparent opacity={0.35} />
        </mesh>
        <mesh ref={(el) => (refs.current[i] = el)} position={a.clone().add(b).multiplyScalar(0.5)} scale={0.35}>
          <icosahedronGeometry args={[0.28, 1]} />
          <meshStandardMaterial color='#ffffff' emissive='#bf61ff' emissiveIntensity={0.3} flatShading toneMapped={false} />
        </mesh>
      </group>
    );
  });
};

const HelixScene = ({ sectionRef, count, reduceMotion }) => {
  const groupRef = useRef();
  const progressRef = useRef(reduceMotion ? 1 : 0);

  useFrame((state, delta) => {
    if (reduceMotion) return;
    const target = sectionProgress(sectionRef.current);
    progressRef.current = MathUtils.damp(progressRef.current, target, 4, delta);
    if (groupRef.current) {
      // Spin with scroll plus a slow idle rotation.
      groupRef.current.rotation.y = progressRef.current * Math.PI * 2 + state.clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, 0, 0.12]}>
      <Strand phase={0} color='#915EFF' progressRef={progressRef} />
      <Strand phase={Math.PI} color='#00cea8' progressRef={progressRef} />
      <Milestones count={count} progressRef={progressRef} />
    </group>
  );
};

// Sticky full-viewport canvas behind the Experience timeline.
const HelixCanvas = ({ sectionRef, count }) => {
  const containerRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(containerRef, "0px");

  return (
    <div ref={containerRef} aria-hidden className='pointer-events-none absolute inset-0 hidden md:block'>
      <div className='sticky top-0 h-screen opacity-60'>
        <CanvasBoundary>
          <Canvas frameloop={inView ? "always" : "never"} dpr={[1, 1.5]} camera={{ position: [0, 0, 11], fov: 45 }}>
            <ambientLight intensity={0.4} />
            <pointLight position={[4, 4, 6]} intensity={0.8} />
            <HelixScene sectionRef={sectionRef} count={count} reduceMotion={reduceMotion} />
          </Canvas>
        </CanvasBoundary>
      </div>
    </div>
  );
};

export default HelixCanvas;
