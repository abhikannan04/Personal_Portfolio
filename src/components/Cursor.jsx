import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

import { useMediaQuery } from "../hooks";

const INTERACTIVE = "a, button, [role='button'], label, select, summary";
const TEXT_FIELD = "input, textarea, [contenteditable='true']";
const TRAIL_LENGTH = 18;

// Custom cursor for mouse users: a dot that tracks the pointer exactly, a
// ring that follows with a springy lag and grows over anything clickable,
// and a short glowing violet-to-pink trail. Touch devices and visitors who
// prefer reduced motion keep the normal system cursor.
const Cursor = () => {
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduceMotion = useReducedMotion();
  const enabled = finePointer && !reduceMotion;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.6 });

  const [mode, setMode] = useState("default"); // default | hover | text
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    document.documentElement.classList.add("custom-cursor");

    const points = [];
    const onMove = (event) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      points.push({ x: event.clientX, y: event.clientY, t: performance.now() });
      if (points.length > TRAIL_LENGTH) points.shift();

      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(TEXT_FIELD)) setMode("text");
      // 3D objects (the tech balls) switch the body cursor to "pointer".
      else if (target?.closest(INTERACTIVE) || document.body.style.cursor === "pointer") setMode("hover");
      else setMode("default");
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);

    // Trail: a tapered line through recent positions that fades with age.
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frame;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const now = performance.now();
      while (points.length && now - points[0].t > 260) points.shift();
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.lineCap = "round";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(191, 97, 255, 0.8)";
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const life = 1 - (now - b.t) / 260;
        const along = i / points.length;
        ctx.strokeStyle = `rgba(${Math.round(145 + 91 * along)}, ${Math.round(94 - 22 * along)}, ${Math.round(255 - 102 * along)}, ${life * along})`;
        ctx.lineWidth = 1 + 4 * along * life;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      document.documentElement.classList.remove("custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const ringSize = mode === "hover" ? 64 : mode === "text" ? 6 : 36;
  const ringHeight = mode === "text" ? 30 : ringSize;

  return (
    <div aria-hidden className='pointer-events-none fixed inset-0 z-[9999]'>
      <canvas ref={canvasRef} className='absolute inset-0 h-full w-full' />

      {/* Ring */}
      <motion.div
        className='absolute left-0 top-0 rounded-full border-2'
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: ringSize,
          height: ringHeight,
          opacity: visible ? 1 : 0,
          scale: pressed ? 0.75 : 1,
          backgroundColor: mode === "hover" ? "rgba(191,97,255,0.16)" : "rgba(191,97,255,0)",
          borderColor: mode === "hover" ? "rgba(191,97,255,0.9)" : "rgba(255,255,255,0.75)",
          boxShadow: mode === "hover" ? "0 0 24px rgba(191,97,255,0.55)" : "0 0 0 rgba(191,97,255,0)",
          borderRadius: mode === "text" ? 3 : 999,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      {/* Dot */}
      <motion.div
        className='absolute left-0 top-0 h-2 w-2 rounded-full bg-[#bf61ff] shadow-[0_0_12px_3px_rgba(191,97,255,0.8)]'
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: visible && mode !== "text" ? 1 : 0, scale: mode === "hover" ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />
    </div>
  );
};

export default Cursor;
