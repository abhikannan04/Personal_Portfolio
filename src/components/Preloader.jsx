import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { profile } from "../constants";

const MIN_DURATION = 1000; // ms, so the intro never just flashes
const MAX_DURATION = 3000; // ms, never block the page on slow fonts
const WELCOME_DURATION = 1100; // ms the "Welcome!" message stays up

// Marquee row. Animated with CSS (compositor thread) rather than JS, so it
// keeps moving smoothly while the 3D scenes are being built behind it.
const MarqueeRow = ({ reverse }) => {
  const words = [...profile.roles, profile.fullName];
  const items = [...words, ...words];

  return (
    <div className='flex whitespace-nowrap overflow-hidden'>
      <div className={`flex shrink-0 items-center gap-10 pr-10 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
        {items.map((word, i) => (
          <React.Fragment key={`${word}-${i}`}>
            <span className='text-outline font-semibold uppercase text-[56px] sm:text-[96px] leading-none'>
              {word}
            </span>
            <span className='h-4 w-4 rounded-full bg-[#915EFF] shrink-0' />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Full-screen intro: a loading count, then "Welcome!", then it fades away to
// reveal the page. It waits for the web fonts plus a short minimum; the heavy
// 3D scenes lower down load on demand.
const Preloader = () => {
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading | welcome | done
  const startRef = useRef(performance.now());
  const fontsReady = useRef(false);

  useEffect(() => {
    // Wait for Geist so text doesn't visibly swap fonts after the reveal.
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      fontsReady.current = true;
    });
  }, []);

  useEffect(() => {
    let frame;
    let value = 0;
    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const timeCap = Math.min(100, (elapsed / MIN_DURATION) * 100);
      const fontCap = fontsReady.current ? 100 : 90;
      const target = elapsed > MAX_DURATION ? 100 : Math.min(timeCap, fontCap);

      const next = value + Math.max(0, target - value) * 0.18;
      value = target - next < 0.5 ? Math.max(value, target) : next;
      setShown(Math.round(value));

      if (value < 100) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (shown >= 100 && phase === "loading") {
      const id = setTimeout(() => setPhase("welcome"), 150);
      return () => clearTimeout(id);
    }
    if (phase === "welcome") {
      const id = setTimeout(() => setPhase("done"), WELCOME_DURATION);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [shown, phase]);

  // Lock scrolling while the loader is visible.
  useEffect(() => {
    document.documentElement.style.overflow = phase === "done" ? "" : "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [phase]);

  const loading = phase === "loading";

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key='preloader'
          className='fixed inset-0 z-[100] flex flex-col justify-center gap-6 bg-primary'
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          role='status'
          aria-label={loading ? `Loading ${shown}%` : "Welcome!"}
        >
          <div className={`flex flex-col gap-6 transition-opacity duration-500 ${loading ? "opacity-100" : "opacity-0"}`}>
            <MarqueeRow />
            <MarqueeRow reverse />
          </div>

          <div className='absolute inset-0 flex items-center justify-center'>
            {loading ? (
              <div className='rounded-full p-[2px] green-pink-gradient shadow-[0_0_60px_#915EFF66]'>
                <div className='flex items-center gap-6 rounded-full bg-black px-8 py-4'>
                  <span className='font-mono text-[14px] font-semibold tracking-[0.2em] text-white'>
                    LOADING
                  </span>
                  <span className='font-mono text-[14px] tabular-nums text-white/70 w-12 text-right'>
                    {shown}%
                  </span>
                </div>
              </div>
            ) : (
              // CSS animation, so it plays smoothly even while the page is busy.
              <div className='animate-welcome text-center'>
                <p className='text-gradient-violet font-bold text-[56px] sm:text-[96px] leading-none tracking-tight'>
                  Welcome!
                </p>
                <p className='mt-4 font-mono text-[14px] sm:text-[16px] tracking-[0.25em] uppercase text-white/60'>
                  to {profile.fullName}'s portfolio
                </p>
              </div>
            )}
          </div>

          <div
            className='absolute bottom-0 left-0 h-[3px] green-pink-gradient transition-[width] duration-200'
            style={{ width: `${shown}%` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
