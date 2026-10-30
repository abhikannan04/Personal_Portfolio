import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";

import { profile } from "../constants";
import { useMediaQuery } from "../hooks";
import { AvatarCanvas } from "./canvas";

const ROLE_INTERVAL = 2600;
const longestRole = profile.roles.reduce((a, b) => (b.length > a.length ? b : a), "");

// Cycles through profile.roles with a vertical slide.
const RotatingRole = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % profile.roles.length), ROLE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <span className='relative block overflow-hidden'>
      {/* Invisible longest role reserves the width and height. */}
      <span aria-hidden className='invisible block whitespace-nowrap'>{longestRole}</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={profile.roles[index]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className='absolute inset-x-0 top-0 block whitespace-nowrap text-gradient-violet'
        >
          {profile.roles[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const Hero = () => {
  const { scrollY } = useScroll();
  const textOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const textY = useTransform(scrollY, [0, 400], [0, -80]);
  const [firstName, ...rest] = profile.fullName.split(" ");
  // On desktop the character lives in the shared <AvatarStage> so it can
  // carry on into the Overview section; smaller screens get their own.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <section className='relative w-full h-screen mx-auto overflow-hidden'>
      {/* Ambient glows */}
      <div aria-hidden className='pointer-events-none -z-10 absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-[#bf61ff]/30 blur-[120px]' />
      <div aria-hidden className='pointer-events-none -z-10 absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-[#00cea8]/15 blur-[120px]' />
      <div aria-hidden className='pointer-events-none -z-10 absolute bottom-[22%] left-1/2 -translate-x-1/2 h-[320px] w-[700px] rounded-full bg-[#915EFF]/25 blur-[140px]' />

      {!isDesktop && <AvatarCanvas pose='bust' />}

      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className='pointer-events-none absolute inset-0 max-w-7xl mx-auto sm:px-16 px-6 flex flex-col justify-start pt-28 sm:justify-center sm:pt-0'
      >
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6'>
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <p className='font-mono text-[#bf61ff] text-[15px] sm:text-[18px] tracking-wide'>
              Hello! I'm
            </p>
            <h1 className='mt-1 font-semibold uppercase text-white leading-[0.95] tracking-tight text-[40px] sm:text-[52px] lg:text-[64px]'>
              {firstName}
              <br />
              {rest.join(" ")}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className='sm:text-right'
          >
            <p className='font-mono text-[#bf61ff] text-[15px] sm:text-[18px]'>A</p>
            <p className='font-semibold uppercase leading-[1] tracking-tight text-[32px] sm:text-[40px] lg:text-[44px] xl:text-[56px]'>
              <RotatingRole />
            </p>
            <p className='mt-1 font-medium uppercase text-white/90 tracking-tight text-[22px] sm:text-[30px] lg:text-[38px]'>
              Developer
            </p>
          </motion.div>
        </div>
      </motion.div>

      <div className='absolute bottom-8 w-full flex justify-center items-center'>
        <a href='#about' aria-label='Scroll to about section'>
          <div className='w-[35px] h-[64px] rounded-3xl border-4 border-secondary flex justify-center items-start p-2'>
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className='w-3 h-3 rounded-full bg-secondary mb-1'
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
