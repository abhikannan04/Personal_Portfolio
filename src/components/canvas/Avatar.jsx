import React, { Suspense, forwardRef, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  MathUtils,
  Path,
  RepeatWrapping,
  Shape,
} from "three";

import CanvasBoundary from "./CanvasBoundary";
import { EYE, buildHead, groomSkinShader } from "./headGeometry";
import { useInView, useMediaQuery, windowPointer } from "../../hooks";
import { lookTargets } from "./lookTargets";

// A stylised character (bearded, with black glasses, in an open jacket) built entirely
// from primitives (no model to download). It stands in the hero, and as the
// page scrolls it sits down at a desk and types. Pose is driven by a 0..1 progress value:
//   0 = standing bust facing the visitor, 1 = seated and typing.
// The character faces +z; the desk sits in front of it.

// Palette. SKIN is a warm natural tone; change it to taste.
const SKIN = "#b9886a";
const LIP_UPPER = "#8f4e48";
const LIP_LOWER = "#a8625a";
const BEARD = "#2a1c15";
const BLUSH = "#bd7862";
const HAIR = "#231914";
const IRIS = "#4a2c1a";
const JACKET = "#262a38";
const TEE = "#ecebf2";
const TROUSERS = "#1b2030";
const SHOES = "#f6f4fa";
const WOOD = "#f1eef6";

const clay = { roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.6 };
const fabric = { roughness: 0.8, sheen: 0.5, sheenColor: "#8b8fb3" };
const skinMat = {
  color: SKIN,
  roughness: 0.55,
  clearcoat: 0.15,
  clearcoatRoughness: 0.6,
  sheen: 0.4,
  sheenColor: "#f0c4a8",
};
const frameMat = { color: "#0b0a10", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.25 };

// Eyelid rotation (radians about X): calm and slightly hooded when open,
// swung down over the eye when closed.
const LID_OPEN = -0.4;
const LID_CLOSED = 1.68;

// Blink timing in seconds: a quick close, a short hold, a slower open.
const BLINK_CLOSE = 0.09;
const BLINK_HOLD = 0.04;
const BLINK_OPEN = 0.18;
const BLINK_TOTAL = BLINK_CLOSE + BLINK_HOLD + BLINK_OPEN;

// 0 = open, 1 = closed, `s` seconds into a blink.
const blinkAmount = (s) => {
  if (s < 0 || s >= BLINK_TOTAL) return 0;
  if (s < BLINK_CLOSE) return (s / BLINK_CLOSE) ** 2;
  if (s < BLINK_CLOSE + BLINK_HOLD) return 1;
  const u = (s - BLINK_CLOSE - BLINK_HOLD) / BLINK_OPEN;
  return (1 - u) ** 2;
};

const smoothstep = (edge0, edge1, x) => {
  const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

// Joint angles for the two poses; interpolated by progress.
const POSE = {
  stand: { hip: 0, knee: 0, shoulderX: 0.05, shoulderZ: 0.14, elbow: -0.15 },
  sit: { hip: -Math.PI / 2, knee: Math.PI / 2, shoulderX: -0.5, shoulderZ: -0.06, elbow: -1.1 },
};

// Head size when seated, relative to standing.
const SEATED_HEAD_SCALE = 1.4;

// Head pitch (radians, down) that points the face at the laptop screen.
const SEATED_HEAD_PITCH = 0.62;

const FLOOR_Y = -4.45;
const DESK_TOP_Y = -1.4;
const LAPTOP_Z = 2.15; // laptop centre, in front of the character
const LID_TILT = 0.26; // lid opened slightly past vertical

/* ---------------------------------------------------------------- parts -- */

// A capsule limb hanging from its joint (the group origin). Children attach
// at the far end, so joints nest naturally.
const Limb = forwardRef(({ length, radius, color, children, ...props }, ref) => (
  <group ref={ref} {...props}>
    <mesh position={[0, -length / 2, 0]}>
      <capsuleGeometry args={[radius, Math.max(length - radius, 0.01), 8, 20]} />
      <meshPhysicalMaterial color={color} {...fabric} />
    </mesh>
    <group position={[0, -length, 0]}>{children}</group>
  </group>
));

// Iris: a warm brown ring with radial streaks, a dark limbal ring and the
// pupil, painted for a sphere whose pole faces forward.
const useIrisTexture = () =>
  useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#050307");
    g.addColorStop(0.09, "#050307");
    g.addColorStop(0.11, "#2a170d");
    g.addColorStop(0.2, "#6b4024");
    g.addColorStop(0.3, "#4a2c1a");
    g.addColorStop(0.36, "#21130b");
    g.addColorStop(0.4, "#f4efe9");
    g.addColorStop(1, "#f4efe9");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 140; i++) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = i % 2 ? "#8a5a34" : "#1d0f08";
      ctx.fillRect(Math.random() * size, size * 0.11, 1.5, size * 0.24);
    }
    return new CanvasTexture(canvas);
  }, []);

// The iris bulges past the eyeball like a cornea (its front is ~0.122 from
// the eye centre), so the lids are larger than that to cover it fully when
// the eye closes.
const LID_RADIUS = 0.128;

// Eyeball with an iris that turns to look around, plus eyelids. The upper
// lid swings down to blink; a dark lash line runs along its edge.
const Eye = forwardRef(({ position, gazeRef, iris }, lidRef) => (
  <group position={position}>
    <mesh>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshPhysicalMaterial color='#f4efe9' roughness={0.2} clearcoat={1} />
    </mesh>
    <group ref={gazeRef}>
      <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.052, 32, 32]} />
        <meshPhysicalMaterial map={iris} roughness={0.1} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      <mesh position={[0.02, 0.025, 0.113]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshBasicMaterial color='#ffffff' />
      </mesh>
    </group>
    <mesh ref={lidRef} rotation={[LID_OPEN, 0, 0]}>
      <sphereGeometry args={[LID_RADIUS, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshPhysicalMaterial {...skinMat} side={DoubleSide} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[LID_RADIUS, 0.006, 6, 32, Math.PI]} />
        <meshStandardMaterial color='#15100d' roughness={0.7} />
      </mesh>
    </mesh>
    <mesh rotation={[0.3, 0, 0]}>
      <sphereGeometry args={[LID_RADIUS - 0.002, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      <meshPhysicalMaterial {...skinMat} side={DoubleSide} />
    </mesh>
  </group>
));

// Rounded-rectangle outline traced into a Shape or Path.
const roundedRect = (shape, x, y, w, h, r) => {
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
};

const LENS_W = 0.4;
const LENS_H = 0.25;
const RIM = 0.024;

// Black glasses. `z` is the lens plane; the temple arms run back to the
// ears at `sideX`.
const Glasses = ({ y, z, sideX }) => {
  const rimGeometry = useMemo(() => {
    const outer = roundedRect(new Shape(), -LENS_W / 2, -LENS_H / 2, LENS_W, LENS_H, 0.08);
    outer.holes.push(
      roundedRect(new Path(), -LENS_W / 2 + RIM, -LENS_H / 2 + RIM, LENS_W - RIM * 2, LENS_H - RIM * 2, 0.055)
    );
    const geometry = new ExtrudeGeometry(outer, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSize: 0.006,
      bevelThickness: 0.006,
      bevelSegments: 2,
      curveSegments: 10,
    });
    geometry.translate(0, 0, -0.0125);
    return geometry;
  }, []);

  const hinge = [EYE.x + LENS_W / 2, y + 0.05, z - 0.03];
  const end = [sideX + 0.05, y + 0.03, -0.1];
  const dx = end[0] - hinge[0];
  const dz = end[2] - hinge[2];
  const length = Math.hypot(dx, dz);

  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <group position={[side * EYE.x, y, z]} rotation={[0, side * 0.1, 0]}>
            <mesh geometry={rimGeometry}>
              <meshPhysicalMaterial {...frameMat} />
            </mesh>
            {/* Nearly clear lens so the eyes stay visible */}
            <mesh>
              <planeGeometry args={[LENS_W - RIM * 2, LENS_H - RIM * 2]} />
              <meshPhysicalMaterial color='#ffffff' transparent opacity={0.08} roughness={0} depthWrite={false} />
            </mesh>
          </group>
          {/* Temple arm running back to the ear */}
          <mesh
            position={[side * (hinge[0] + dx / 2), (hinge[1] + end[1]) / 2, hinge[2] + dz / 2]}
            rotation={[0, Math.atan2(side * dx, dz), 0]}
          >
            <boxGeometry args={[0.024, 0.034, length]} />
            <meshPhysicalMaterial {...frameMat} />
          </mesh>
        </group>
      ))}
      {/* Bridge */}
      <mesh position={[0, y + 0.045, z + 0.005]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, 2 * EYE.x - LENS_W + 0.02, 12]} />
        <meshPhysicalMaterial {...frameMat} />
      </mesh>
    </group>
  );
};

// Fine streaks used as a bump map so hair and beard read as hair, not plastic.
const useStrandTexture = (stretch, repeat) =>
  useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2600; i++) {
      const shade = Math.floor(70 + Math.random() * 120);
      ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
      ctx.lineWidth = 1;
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 3, y + stretch * (0.5 + Math.random()));
      ctx.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
    return texture;
  }, [stretch, repeat[0], repeat[1]]);

// Layers grown from the skin share its surface, so they are drawn with a
// small depth offset to win where they meet it, and fade out at the edge.
const layerMat = {
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
  vertexColors: true,
  transparent: true,
};

const Head = forwardRef(({ gazeRefs, leftLidRef, rightLidRef }, ref) => {
  const head = useMemo(
    () =>
      buildHead({
        skin: SKIN,
        lipUpper: LIP_UPPER,
        lipLower: LIP_LOWER,
        hair: HAIR,
        blush: BLUSH,
        segments: [200, 140],
      }),
    []
  );
  useEffect(
    () => () => ["skin", "hair"].forEach((key) => head[key].dispose()),
    [head]
  );
  const iris = useIrisTexture();
  const hairBump = useStrandTexture(12, [20, 10]);
  const hairMat = {
    ...layerMat,
    color: HAIR,
    // Matte, not shiny.
    roughness: 0.92,
    bumpMap: hairBump,
    bumpScale: 0.05,
  };

  return (
    <group ref={ref} position={[0, 1.55, 0]}>
      <mesh geometry={head.skin}>
        <meshPhysicalMaterial
          {...skinMat}
          color='#ffffff'
          vertexColors
          onUpdate={(material) => groomSkinShader(material, { beard: BEARD, brow: HAIR })}
        />
      </mesh>
      <mesh geometry={head.hair}>
        <meshPhysicalMaterial {...hairMat} />
      </mesh>

      {/* Ears */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (head.sideX - 0.02), -0.01, -0.06]} rotation={[0, side * 0.25, side * -0.08]}>
          <mesh scale={[0.32, 0.64, 0.46]}>
            <sphereGeometry args={[0.24, 24, 24]} />
            <meshPhysicalMaterial {...skinMat} />
          </mesh>
          <mesh position={[side * 0.04, 0, 0.02]} scale={[0.15, 0.42, 0.28]}>
            <sphereGeometry args={[0.24, 16, 16]} />
            <meshPhysicalMaterial {...skinMat} color='#b5836a' />
          </mesh>
        </group>
      ))}

      <Eye
        ref={leftLidRef}
        gazeRef={(el) => (gazeRefs.current[0] = el)}
        iris={iris}
        position={[-EYE.x, EYE.y, head.eyeZ]}
      />
      <Eye
        ref={rightLidRef}
        gazeRef={(el) => (gazeRefs.current[1] = el)}
        iris={iris}
        position={[EYE.x, EYE.y, head.eyeZ]}
      />

      <Glasses y={EYE.y} z={head.glassesZ} sideX={head.sideX} />
    </group>
  );
});

// Glowing monitor content: a code editor drawn once into a canvas.
const useScreenTexture = () =>
  useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const bg = ctx.createLinearGradient(0, 0, 512, 512);
    bg.addColorStop(0, "#2a1450");
    bg.addColorStop(1, "#ec4899");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 512);
    const colors = ["#ffffff", "#c4b5fd", "#67e8f9", "#fbcfe8", "#a7f3d0"];
    for (let i = 0; i < 26; i++) {
      const indent = [0, 1, 2, 2, 1, 3][i % 6] * 26;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(28 + indent, 20 + i * 19, 60 + ((i * 53) % 220), 8);
    }
    const texture = new CanvasTexture(canvas);
    texture.wrapT = RepeatWrapping;
    return texture;
  }, []);

// Soft pink pool of light on the floor.
const useGlowTexture = () =>
  useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(236, 72, 153, 0.9)");
    g.addColorStop(0.5, "rgba(145, 94, 255, 0.35)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new CanvasTexture(canvas);
  }, []);

const Workstation = forwardRef(({ screenRef }, ref) => {
  const screen = useScreenTexture();
  screenRef.current = screen;

  return (
    <group ref={ref}>
      {/* Desk */}
      <mesh position={[0, DESK_TOP_Y, 2.4]}>
        <boxGeometry args={[5.2, 0.12, 2.4]} />
        <meshPhysicalMaterial color={WOOD} {...clay} />
      </mesh>
      {[
        [-2.45, 1.35],
        [2.45, 1.35],
        [-2.45, 3.45],
        [2.45, 3.45],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, (DESK_TOP_Y + FLOOR_Y) / 2, z]}>
          <boxGeometry args={[0.12, DESK_TOP_Y - FLOOR_Y, 0.12]} />
          <meshPhysicalMaterial color={WOOD} {...clay} />
        </mesh>
      ))}

      {/* Laptop: base with keyboard deck, lid hinged at the back edge and
          opened ~105 degrees so the screen faces the character. */}
      <group position={[0, DESK_TOP_Y + 0.06, LAPTOP_Z]}>
        <RoundedBox args={[2.2, 0.08, 1.5]} radius={0.03} position={[0, 0.04, 0]}>
          <meshPhysicalMaterial color='#d9d6e3' roughness={0.35} metalness={0.4} clearcoat={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.085, -0.12]}>
          <boxGeometry args={[1.9, 0.01, 0.75]} />
          <meshStandardMaterial color='#2b2738' roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.085, 0.42]}>
          <boxGeometry args={[0.6, 0.008, 0.36]} />
          <meshStandardMaterial color='#bdb8cc' roughness={0.4} />
        </mesh>
        <group position={[0, 0.08, 0.75]} rotation={[LID_TILT, 0, 0]}>
          <RoundedBox args={[2.2, 1.45, 0.06]} radius={0.03} position={[0, 0.725, 0]}>
            <meshPhysicalMaterial color='#d9d6e3' roughness={0.35} metalness={0.4} clearcoat={0.5} />
          </RoundedBox>
          {/* Screen on the inside of the lid, facing the character (-z). */}
          <mesh position={[0, 0.74, -0.032]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[2.02, 1.27]} />
            <meshBasicMaterial map={screen} toneMapped={false} />
          </mesh>
          {/* Glowing logo on the back of the lid */}
          <mesh position={[0, 0.74, 0.032]}>
            <circleGeometry args={[0.14, 32]} />
            <meshBasicMaterial color='#f9a8d4' toneMapped={false} />
          </mesh>
        </group>
        {/* Screen light spilling onto the character */}
        <pointLight position={[0, 0.9, 0.2]} intensity={0.9} distance={4} color='#f0abfc' />
      </group>

      {/* Coffee mug */}
      <group position={[-1.75, DESK_TOP_Y + 0.3, 2.0]}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.18, 0.48, 32]} />
          <meshPhysicalMaterial color='#f9fafb' {...clay} />
        </mesh>
        <mesh position={[0, 0.235, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.17, 32]} />
          <meshStandardMaterial color='#4a2c1a' />
        </mesh>
        <mesh position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.11, 0.035, 12, 24]} />
          <meshPhysicalMaterial color='#f9fafb' {...clay} />
        </mesh>
      </group>

      {/* Phone on a stand */}
      <group position={[1.75, DESK_TOP_Y + 0.4, 2.4]} rotation={[-0.25, -0.5, 0]}>
        <RoundedBox args={[0.42, 0.78, 0.05]} radius={0.03}>
          <meshStandardMaterial color='#f472b6' emissive='#ec4899' emissiveIntensity={0.4} />
        </RoundedBox>
      </group>

      {/* Chair */}
      <RoundedBox args={[2.1, 0.22, 2.0]} radius={0.08} position={[0, -2.95, 0.1]}>
        <meshPhysicalMaterial color={WOOD} {...clay} />
      </RoundedBox>
      <RoundedBox args={[2.0, 2.3, 0.18]} radius={0.08} position={[0, -1.75, -1.15]} rotation={[-0.12, 0, 0]}>
        <meshPhysicalMaterial color={WOOD} {...clay} />
      </RoundedBox>
      {[
        [-0.9, -0.7, 0.15],
        [0.9, -0.7, -0.15],
        [-0.9, 0.9, 0.15],
        [0.9, 0.9, -0.15],
      ].map(([x, z, tilt]) => (
        <mesh key={`${x}-${z}`} position={[x, (FLOOR_Y - 3.05) / 2, z]} rotation={[0, 0, tilt]}>
          <cylinderGeometry args={[0.05, 0.05, -3.05 - FLOOR_Y, 8]} />
          <meshPhysicalMaterial color={WOOD} {...clay} />
        </mesh>
      ))}
    </group>
  );
});

/* ------------------------------------------------------------ character -- */

const Character = ({ progressRef, leaveRef, reduceMotion, layout }) => {
  const { viewport } = useThree();
  const stageRef = useRef();
  const torsoRef = useRef();
  const headRef = useRef();
  const gazeRefs = useRef([]);
  const leftLidRef = useRef();
  const rightLidRef = useRef();
  const leftHip = useRef();
  const rightHip = useRef();
  const leftKnee = useRef();
  const rightKnee = useRef();
  const leftShoulder = useRef();
  const rightShoulder = useRef();
  const leftElbow = useRef();
  const rightElbow = useRef();
  const workstationRef = useRef();
  const glowRef = useRef();
  const screenRef = useRef();
  const blink = useRef({ next: 2.5, start: -10 });
  const glowTexture = useGlowTexture();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const p = progressRef.current;
    // 0..1 as the services section scrolls in: he stands up again and moves
    // to the right to watch the cards on the left.
    const leave = smoothstep(0, 1, leaveRef.current);
    const sitIn = smoothstep(0.1, 0.75, p);
    const sit = sitIn * (1 - leave); // body pose
    const rise = smoothstep(0.35, 0.9, p) * (1 - leave); // desk & chair rise in
    const typing = reduceMotion ? 0 : smoothstep(0.85, 1, p) * (1 - leave);

    /* Placement on screen. */
    const target = layout(viewport);
    const side = target.side || target.seated;
    const stage = stageRef.current;
    stage.position.set(
      MathUtils.lerp(MathUtils.lerp(target.bust.x, target.seated.x, sitIn), side.x, leave),
      MathUtils.lerp(MathUtils.lerp(target.bust.y, target.seated.y, sitIn), side.y, leave),
      0
    );
    stage.scale.setScalar(
      MathUtils.lerp(MathUtils.lerp(target.bust.scale, target.seated.scale, sitIn), side.scale, leave)
    );
    stage.rotation.y = MathUtils.lerp(MathUtils.lerp(0, 0.95, sitIn), -0.45, leave);

    /* Legs and arms. */
    const pose = (key) => MathUtils.lerp(POSE.stand[key], POSE.sit[key], sit);
    [leftHip, rightHip].forEach((ref) => (ref.current.rotation.x = pose("hip")));
    [leftKnee, rightKnee].forEach((ref) => (ref.current.rotation.x = pose("knee")));
    [leftShoulder, rightShoulder].forEach((ref, i) => {
      const side = i === 0 ? -1 : 1;
      ref.current.rotation.x = pose("shoulderX") + Math.sin(t * 9 + i * 1.7) * 0.02 * typing;
      ref.current.rotation.z = side * pose("shoulderZ");
    });
    [leftElbow, rightElbow].forEach((ref, i) => {
      // Alternating, slightly irregular taps while typing.
      const tap = (Math.sin(t * 19 + i * 2.1) + Math.sin(t * 13 + i)) * 0.035 * typing;
      ref.current.rotation.x = pose("elbow") + tap;
    });

    /* Breathing. */
    if (!reduceMotion) torsoRef.current.scale.y = 1 + Math.sin(t * 1.6) * 0.012;

    /* Head: follows the cursor when standing; when seated it looks down
       at the laptop screen, with a slight bob while typing. */
    const followX = reduceMotion ? 0 : windowPointer.x * 0.55;
    const followY = reduceMotion ? 0 : -windowPointer.y * 0.3;
    const seatedX = SEATED_HEAD_PITCH + Math.sin(t * 2.3) * 0.015 * typing;
    // Beside the services, he looks at the newest card that has come in.
    let lookPitch = 0;
    if (leave > 0) {
      let newest = -Infinity;
      lookTargets.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const centre = rect.top + rect.height / 2;
        if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0 && centre > newest) newest = centre;
      });
      if (newest > -Infinity) lookPitch = MathUtils.clamp((newest / window.innerHeight - 0.42) * 0.9, -0.3, 0.4);
    }
    const head = headRef.current;
    const headYaw = MathUtils.lerp(MathUtils.lerp(followX, 0, sit), -0.5, leave);
    const headPitch = MathUtils.lerp(MathUtils.lerp(followY, seatedX, sit), lookPitch, leave);
    head.rotation.y = MathUtils.damp(head.rotation.y, headYaw, 4, delta);
    head.rotation.x = MathUtils.damp(head.rotation.x, headPitch, 4, delta);
    // The head grows as he sits so the face reads clearly at the smaller
    // seated scale; it is raised so the chin still clears the collar.
    const headScale = MathUtils.lerp(1, SEATED_HEAD_SCALE, sit);
    head.scale.setScalar(headScale);
    head.position.y = 1.55 + (headScale - 1) * 0.8 + (reduceMotion ? 0 : Math.sin(t * 1.6) * 0.01);

    // Eyes turn towards the cursor, then down to the screen when seated.
    const gazeYaw = MathUtils.lerp(MathUtils.lerp(reduceMotion ? 0 : windowPointer.x * 0.35, 0, sit), -0.3, leave);
    const gazePitch = MathUtils.lerp(
      MathUtils.lerp(reduceMotion ? 0 : -windowPointer.y * 0.25, 0.25, sit),
      lookPitch * 0.6,
      leave
    );
    gazeRefs.current.forEach((eye) => {
      if (!eye) return;
      eye.rotation.y = MathUtils.damp(eye.rotation.y, gazeYaw, 8, delta);
      eye.rotation.x = MathUtils.damp(eye.rotation.x, gazePitch, 8, delta);
    });

    /* Blinks every 3-6 s, with an occasional quick double blink. */
    if (!reduceMotion) {
      const b = blink.current;
      if (t > b.next) {
        b.start = t;
        b.next = Math.random() < 0.2 ? t + BLINK_TOTAL + 0.12 : t + 3 + Math.random() * 3;
      }
      const lid = MathUtils.lerp(LID_OPEN, LID_CLOSED, blinkAmount(t - b.start));
      leftLidRef.current.rotation.x = lid;
      rightLidRef.current.rotation.x = lid;
    }

    /* Desk, chair and floor glow rise up out of the floor. */
    workstationRef.current.visible = rise > 0.001;
    workstationRef.current.position.y = (1 - rise) * -7;
    glowRef.current.visible = rise > 0.001;
    glowRef.current.material.opacity = rise * 0.9;

    // Code scrolls on screen while typing.
    if (screenRef.current && typing > 0) screenRef.current.offset.y -= delta * 0.04 * typing;
  });

  return (
    <group ref={stageRef}>
      {/* Torso */}
      <group ref={torsoRef}>
        {/* Open charcoal jacket over a white crew-neck tee. */}
        <mesh position={[0, -0.55, 0]} scale={[1.05, 1.0, 0.66]}>
          <sphereGeometry args={[1.2, 64, 48]} />
          <meshPhysicalMaterial color={JACKET} {...fabric} />
        </mesh>
        <mesh position={[0, -1.4, 0]} scale={[1, 1, 0.62]}>
          <cylinderGeometry args={[1.24, 1.12, 1.7, 48, 1, true]} />
          <meshPhysicalMaterial color={JACKET} {...fabric} />
        </mesh>
        {/* Tee showing down the open front */}
        <mesh position={[0, -0.55, 0]} scale={[1.06, 1.01, 0.67]}>
          <sphereGeometry args={[1.2, 32, 32, Math.PI / 2 - 0.3, 0.6, 0.02, Math.PI * 0.6]} />
          <meshPhysicalMaterial color={TEE} {...fabric} sheenColor='#ffffff' />
        </mesh>
        <mesh position={[0, -1.4, 0]} scale={[1.01, 1, 0.63]}>
          <cylinderGeometry args={[1.24, 1.12, 1.7, 24, 1, true, -0.27, 0.54]} />
          <meshPhysicalMaterial color={TEE} {...fabric} sheenColor='#ffffff' />
        </mesh>
        {/* Lapel edges along the opening */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0, -0.55, 0]} scale={[1.065, 1.012, 0.675]}>
            <sphereGeometry
              args={[1.2, 8, 32, side > 0 ? Math.PI / 2 - 0.36 : Math.PI / 2 + 0.3, 0.06, 0.05, Math.PI * 0.6]}
            />
            <meshPhysicalMaterial color='#1a1d27' {...fabric} />
          </mesh>
        ))}
        {/* Crew-neck collar of the tee */}
        <mesh position={[0, 0.6, 0.02]} rotation={[Math.PI / 2 + 0.12, 0, 0]}>
          <torusGeometry args={[0.4, 0.05, 12, 40]} />
          <meshPhysicalMaterial color={TEE} {...fabric} sheenColor='#ffffff' />
        </mesh>
        {/* Shoulder caps give a defined shoulder line. */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1.0, -0.05, 0]} scale={[1, 0.8, 0.85]}>
            <sphereGeometry args={[0.32, 32, 24]} />
            <meshPhysicalMaterial color={JACKET} {...fabric} />
          </mesh>
        ))}
        {/* Hips */}
        <mesh position={[0, -2.25, 0]} scale={[1.18, 0.6, 0.76]}>
          <sphereGeometry args={[1, 48, 32]} />
          <meshPhysicalMaterial color={TROUSERS} {...clay} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 0.84, 0]}>
        <cylinderGeometry args={[0.36, 0.4, 0.56, 24]} />
        <meshPhysicalMaterial color={SKIN} {...clay} />
      </mesh>

      <Head ref={headRef} gazeRefs={gazeRefs} leftLidRef={leftLidRef} rightLidRef={rightLidRef} />

      {/* Arms: shoulder -> elbow -> hand */}
      {[
        [-1, leftShoulder, leftElbow],
        [1, rightShoulder, rightElbow],
      ].map(([side, shoulderRef, elbowRef]) => (
        <Limb key={side} ref={shoulderRef} position={[side * 1.1, 0.02, 0]} length={1.4} radius={0.27} color={JACKET}>
          <Limb ref={elbowRef} length={1.2} radius={0.23} color={JACKET}>
            <mesh position={[0, -0.1, 0]} scale={[1, 0.85, 1.2]}>
              <sphereGeometry args={[0.21, 24, 24]} />
              <meshPhysicalMaterial color={SKIN} {...clay} />
            </mesh>
          </Limb>
        </Limb>
      ))}

      {/* Legs: hip -> knee -> shoe */}
      {[
        [-1, leftHip, leftKnee],
        [1, rightHip, rightKnee],
      ].map(([side, hipRef, kneeRef]) => (
        <Limb key={side} ref={hipRef} position={[side * 0.55, -2.35, 0]} length={1.9} radius={0.4} color={TROUSERS}>
          <Limb ref={kneeRef} length={1.85} radius={0.33} color={TROUSERS}>
            <RoundedBox args={[0.62, 0.38, 1.05]} radius={0.15} position={[0, -0.12, 0.22]}>
              <meshPhysicalMaterial color={SHOES} {...clay} />
            </RoundedBox>
          </Limb>
        </Limb>
      ))}

      <Workstation ref={workstationRef} screenRef={screenRef} />

      <mesh ref={glowRef} position={[0.4, FLOOR_Y + 0.01, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial transparent opacity={0} blending={AdditiveBlending} depthWrite={false} map={glowTexture} />
      </mesh>
    </group>
  );
};

/* --------------------------------------------------------------- scenes -- */

const Lights = () => (
  <>
    <ambientLight intensity={0.5} />
    <directionalLight position={[2, 4, 5]} intensity={1.0} />
    {/* Coloured rim lights give the glowing silhouette. */}
    <pointLight position={[-4, 2, -2]} intensity={2.2} color='#f472b6' distance={16} />
    <pointLight position={[4, 1, -2]} intensity={1.6} color='#915EFF' distance={16} />
    <pointLight position={[0, -1, 4]} intensity={0.35} color='#f9a8d4' />
  </>
);

// Where the character sits on screen in each state, per layout.
const layouts = {
  // Desktop: centred bust in the hero, seated on the left in the overview,
  // then standing on the right beside the service cards.
  stage: (vp) => ({
    bust: { x: 0, y: -0.55, scale: 1 },
    seated: { x: -vp.width * 0.26, y: 0.3, scale: Math.min(0.5, vp.height / 10) },
    side: { x: vp.width * 0.21, y: -0.75, scale: 0.78 },
  }),
  // Phone hero: bust lower in the frame, below the intro text.
  mobileBust: () => ({
    bust: { x: 0, y: -2.4, scale: 1 },
    seated: { x: 0, y: -2.4, scale: 1 },
  }),
  // Phone overview box: seated scene centred in its own canvas.
  boxSeated: (vp) => {
    const scale = Math.min(0.6, vp.width / 9.5, vp.height / 8);
    const seated = { x: -0.9 * scale, y: 0.3 + 0.2 * scale, scale };
    return { bust: seated, seated };
  },
};

const noLeave = { current: 0 };

const Scene = ({ progressRef, leaveRef = noLeave, layout, trackScroll }) => {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <Lights />
      {trackScroll && <ScrollProgress progressRef={progressRef} leaveRef={leaveRef} />}
      <Suspense fallback={null}>
        <Character progressRef={progressRef} leaveRef={leaveRef} reduceMotion={reduceMotion} layout={layout} />
        {!reduceMotion && (
          <Sparkles count={45} scale={[9, 6, 4]} position={[0, 0.5, -2]} size={3} speed={0.35} color='#f9a8d4' />
        )}
      </Suspense>
    </>
  );
};

// Page progress from the top of the page to ~one viewport down (0..1).
const scrollProgress = () => MathUtils.clamp(window.scrollY / (window.innerHeight * 0.8), 0, 1);

// 0..1 as the services section moves up into view.
const servicesProgress = () => {
  const section = document.getElementById("services")?.closest("section");
  if (!section) return 0;
  const top = section.getBoundingClientRect().top;
  return MathUtils.clamp((window.innerHeight * 0.9 - top) / (window.innerHeight * 0.6), 0, 1);
};

const ScrollProgress = ({ progressRef, leaveRef }) => {
  useFrame((state, delta) => {
    progressRef.current = MathUtils.damp(progressRef.current, scrollProgress(), 5, delta);
    leaveRef.current = MathUtils.damp(leaveRef.current, servicesProgress(), 5, delta);
  });
  return null;
};

/**
 * Desktop: one sticky, full-viewport canvas spanning the hero, overview and
 * services. Render as the first child of a `relative` wrapper around them.
 */
export const AvatarStage = () => {
  const containerRef = useRef(null);
  const progressRef = useRef(typeof window === "undefined" ? 0 : scrollProgress());
  const leaveRef = useRef(0);
  const inView = useInView(containerRef, "0px");

  return (
    <div ref={containerRef} aria-hidden className='pointer-events-none absolute inset-0 z-0'>
      <div className='sticky top-0 h-screen'>
        <CanvasBoundary>
          <Canvas frameloop={inView ? "always" : "never"} dpr={[1, 1.5]} camera={{ position: [0, 0.4, 8], fov: 35 }}>
            <Scene progressRef={progressRef} leaveRef={leaveRef} layout={layouts.stage} trackScroll />
          </Canvas>
        </CanvasBoundary>
      </div>
    </div>
  );
};

/**
 * Phones: a fixed pose in a normal box. `pose` is "bust" (hero) or
 * "seated" (overview).
 */
const AvatarCanvas = ({ pose = "bust" }) => {
  const containerRef = useRef(null);
  const progressRef = useRef(pose === "seated" ? 1 : 0);
  const inView = useInView(containerRef);
  const isPhone = useMediaQuery("(max-width: 640px)");
  const layout = pose === "seated" ? layouts.boxSeated : isPhone ? layouts.mobileBust : layouts.stage;

  return (
    <div ref={containerRef} className={pose === "seated" ? "w-full h-full" : "absolute inset-0"}>
      <CanvasBoundary>
        <Canvas
          frameloop={inView ? "always" : "never"}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.4, pose === "bust" && isPhone ? 14 : 8], fov: 35 }}
        >
          <Scene progressRef={progressRef} layout={layout} />
        </Canvas>
      </CanvasBoundary>
    </div>
  );
};

export default AvatarCanvas;
