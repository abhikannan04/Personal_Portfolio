import React from "react";
import { motion } from "framer-motion";

import { profile } from "../constants";

const GitHubIcon = () => (
  <svg viewBox='0 0 24 24' className='w-6 h-6' fill='currentColor' aria-hidden>
    <path d='M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z' />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox='0 0 24 24' className='w-6 h-6' fill='currentColor' aria-hidden>
    <path d='M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11.5H3V9.75Zm6.5 0h3.83v1.57h.06c.53-1.01 1.84-2.07 3.79-2.07 4.05 0 4.8 2.67 4.8 6.13v5.87h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75v5.29h-4V9.75Z' />
  </svg>
);

const ResumeIcon = () => (
  <svg viewBox='0 0 24 24' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='1.8' aria-hidden>
    <rect x='5' y='3' width='14' height='18' rx='2' />
    <path d='M9 8h6M9 12h6M9 16h4' strokeLinecap='round' />
  </svg>
);

const reveal = (delay) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

// Fixed GitHub / LinkedIn rail (bottom-left) and Resume link (bottom-right)
// on larger screens. On phones these links live in the Contact section.
const SocialRail = () => (
  <>
    <motion.ul
      {...reveal(1.4)}
      className='hidden md:flex fixed left-4 xl:left-8 bottom-8 z-30 flex-col items-center gap-6'
    >
      <li>
        <a
          href={profile.github}
          target='_blank'
          rel='noopener noreferrer'
          aria-label='GitHub'
          className='block text-white/80 hover:text-white hover:-translate-y-1 transition-all'
        >
          <GitHubIcon />
        </a>
      </li>
      <li>
        <a
          href={profile.linkedin}
          target='_blank'
          rel='noopener noreferrer'
          aria-label='LinkedIn'
          className='block text-white/80 hover:text-white hover:-translate-y-1 transition-all'
        >
          <LinkedInIcon />
        </a>
      </li>
      <li aria-hidden className='w-px h-16 bg-gradient-to-b from-white/40 to-transparent' />
    </motion.ul>

    <motion.a
      {...reveal(1.6)}
      href={profile.resume}
      target='_blank'
      rel='noopener noreferrer'
      className='hidden md:flex fixed right-4 xl:right-8 bottom-8 z-30 items-center gap-2 text-white/50 hover:text-white transition-colors'
    >
      <span className='text-[16px] font-semibold tracking-[0.35em]'>RESUME</span>
      <ResumeIcon />
    </motion.a>
  </>
);

export default SocialRail;
