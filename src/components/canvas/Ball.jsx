import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Decal,
  Float,
  Html,
  Preload,
  useCursor,
  useTexture,
} from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { MathUtils } from "three";

import CanvasLoader from "../Loader";
import CanvasBoundary from "./CanvasBoundary";
import { useInView, useNearViewport } from "../../hooks";

const CELL_SIZE = 140; // px reserved per ball
const LABEL_SPACE = 48; // px below the last row for the hover label
const TWO_PI = Math.PI * 2;

const Ball = ({ texture, name, position, radius, reduceMotion }) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const spinVelocity = useRef(0);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const mesh = meshRef.current;
    if (!group || !mesh) return;

    // Grow on hover.
    const targetScale = radius * (hovered ? 1.25 : 1);
    group.scale.setScalar(MathUtils.damp(group.scale.x, targetScale, 8, delta));

    if (reduceMotion) return;

    // Click-to-spin: fast spin that decays, then settles facing forward.
    spinVelocity.current = MathUtils.damp(spinVelocity.current, 0, 1.5, delta);
    if (Math.abs(spinVelocity.current) > 0.6) {
      mesh.rotation.y += spinVelocity.current * delta;
    } else {
      const facing = Math.round(mesh.rotation.y / TWO_PI) * TWO_PI;
      mesh.rotation.y = MathUtils.damp(mesh.rotation.y, facing, 4, delta);
    }

    // Lean towards the cursor while hovered.
    const leanX = hovered ? -state.pointer.y * 0.5 : 0;
    const leanZ = hovered ? -state.pointer.x * 0.3 : 0;
    mesh.rotation.x = MathUtils.damp(mesh.rotation.x, leanX, 6, delta);
    mesh.rotation.z = MathUtils.damp(mesh.rotation.z, leanZ, 6, delta);
  });

  return (
    <group position={position}>
      <Float
        speed={reduceMotion ? 0 : 1.75}
        rotationIntensity={hovered ? 0 : 0.8}
        floatIntensity={1.2}
        floatingRange={[-radius * 0.08, radius * 0.08]}
      >
        <group ref={groupRef} scale={radius}>
          <mesh
            ref={meshRef}
            castShadow
            receiveShadow
            onPointerOver={(event) => {
              event.stopPropagation();
              setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
            onClick={(event) => {
              event.stopPropagation();
              spinVelocity.current += 14;
            }}
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color='#fff8eb'
              emissive='#915EFF'
              emissiveIntensity={hovered ? 0.35 : 0}
              polygonOffset
              polygonOffsetFactor={-5}
              flatShading
            />
            <Decal
              position={[0, 0, 1]}
              rotation={[2 * Math.PI, 0, 6.25]}
              scale={1}
              map={texture}
              flatShading
            />
          </mesh>
        </group>

        {hovered && (
          <Html position={[0, -radius * 1.55, 0]} center className='pointer-events-none'>
            <span className='whitespace-nowrap rounded-full bg-tertiary/90 px-3 py-1 text-[12px] font-semibold text-white shadow-card border border-[#915EFF]/50'>
              {name}
            </span>
          </Html>
        )}
      </Float>
    </group>
  );
};

const BallGrid = ({ technologies, columns, reduceMotion }) => {
  const textures = useTexture(technologies.map((technology) => technology.icon));
  const { viewport } = useThree();
  const cloudRef = useRef();

  const rows = Math.ceil(technologies.length / columns);
  const cellWidth = viewport.width / columns;
  const cellHeight = (viewport.height - LABEL_SPACE) / rows;
  const radius = Math.min(cellWidth, cellHeight) * 0.3;

  const positions = useMemo(
    () =>
      technologies.map((_, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        // Centre the (possibly shorter) last row.
        const itemsInRow = Math.min(columns, technologies.length - row * columns);
        return [
          (col - (itemsInRow - 1) / 2) * cellWidth,
          ((rows - 1) / 2 - row) * cellHeight,
          0,
        ];
      }),
    [technologies, columns, rows, cellWidth, cellHeight]
  );

  // Tilt the whole grid slightly with the cursor for depth.
  useFrame((state, delta) => {
    if (!cloudRef.current || reduceMotion) return;
    cloudRef.current.rotation.y = MathUtils.damp(cloudRef.current.rotation.y, state.pointer.x * 0.12, 2, delta);
    cloudRef.current.rotation.x = MathUtils.damp(cloudRef.current.rotation.x, -state.pointer.y * 0.08, 2, delta);
  });

  return (
    <group ref={cloudRef} position={[0, LABEL_SPACE / 2, 0]}>
      {technologies.map((technology, index) => (
        <Ball
          key={technology.name}
          name={technology.name}
          texture={textures[index]}
          position={positions[index]}
          radius={radius}
          reduceMotion={reduceMotion}
        />
      ))}
    </group>
  );
};

// All tech balls share one WebGL context. One canvas per ball exceeded the
// browser's context limit (~16) and caused balls to disappear.
const TechCanvas = ({ technologies }) => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();
  const near = useNearViewport(containerRef);
  const inView = useInView(containerRef);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const columns = MathUtils.clamp(Math.floor(width / CELL_SIZE), 3, 7);
  const rows = Math.ceil(technologies.length / columns);

  return (
    <div ref={containerRef} className='w-full' style={{ height: rows * CELL_SIZE + LABEL_SPACE }}>
      {width > 0 && near && (
        <CanvasBoundary
          fallback={
            <div className='flex flex-wrap justify-center gap-10'>
              {technologies.map((technology) => (
                <img
                  key={technology.name}
                  src={technology.icon}
                  alt={technology.name}
                  title={technology.name}
                  className='w-20 h-20 object-contain'
                />
              ))}
            </div>
          }
        >
          <Canvas
            frameloop={inView ? "always" : "never"}
            dpr={[1, 1.5]}
            // Orthographic: the canvas is very wide, and a perspective camera
            // visibly stretched the outer balls. World units = CSS pixels.
            orthographic
            camera={{ position: [0, 0, 500], zoom: 1, near: 1, far: 2000 }}
            gl={{ preserveDrawingBuffer: true }}
          >
            <ambientLight intensity={0.35} />
            <directionalLight position={[0, 0, 500]} intensity={0.9} />
            <pointLight position={[-500, 300, 400]} intensity={0.6} color='#915EFF' />
            <pointLight position={[500, -300, 400]} intensity={0.4} color='#00cea8' />

            <Suspense fallback={<CanvasLoader />}>
              <BallGrid
                technologies={technologies}
                columns={columns}
                reduceMotion={reduceMotion}
              />
            </Suspense>

            <Preload all />
          </Canvas>
        </CanvasBoundary>
      )}
    </div>
  );
};

export default TechCanvas;
