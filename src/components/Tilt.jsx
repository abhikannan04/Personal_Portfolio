import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

const spring = { stiffness: 220, damping: 20, mass: 0.6 };

// 3D perspective tilt with a moving glare highlight. Drop-in replacement for
// react-tilt (which does not support React 18). Children can use the
// `.pop-out-*` utility classes to float above the card surface.
const Tilt = ({
  children,
  className = "",
  wrapperClassName = "",
  max = 15,
  scale = 1.04,
  glare = true,
}) => {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const hover = useMotionValue(0);

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-max, max]), spring);
  const cardScale = useSpring(useTransform(hover, [0, 1], [1, scale]), spring);
  const glareOpacity = useSpring(hover, spring);
  const glareBackground = useTransform(
    [pointerX, pointerY],
    ([x, y]) =>
      `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.22), rgba(255,255,255,0) 60%)`
  );

  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType !== "mouse" || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
    hover.set(1);
  };

  const handlePointerLeave = () => {
    pointerX.set(0.5);
    pointerY.set(0.5);
    hover.set(0);
  };

  return (
    <div className={`[perspective:1000px] ${wrapperClassName}`}>
      <motion.div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ rotateX, rotateY, scale: cardScale }}
        className={`relative preserve-3d ${className}`}
      >
        {children}

        {glare && (
          <motion.div
            aria-hidden
            style={{ background: glareBackground, opacity: glareOpacity }}
            className='pointer-events-none absolute inset-0 rounded-[inherit]'
          />
        )}
      </motion.div>
    </div>
  );
};

export default Tilt;
