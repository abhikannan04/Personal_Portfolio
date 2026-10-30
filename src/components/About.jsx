import React from "react";
import { motion } from "framer-motion";

import Tilt from "./Tilt";
import { AvatarCanvas } from "./canvas";
import { lookTargets } from "./canvas/lookTargets";
import { useMediaQuery } from "../hooks";
import { styles } from "../styles";
import { highlights, profile, services } from "../constants";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";

// Service card on the left: slides in with a slight 3D swing as it scrolls
// into view and fades back out when it leaves, scrolling either way.
const ServiceCard = ({ index, title, accent, description }) => (
  <motion.div
    ref={(el) => (lookTargets[index] = el)}
    initial={{ opacity: 0, x: -90, rotateY: 28 }}
    whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
    viewport={{ once: false, amount: 0.5 }}
    transition={{ type: "spring", stiffness: 70, damping: 16 }}
    style={{ transformPerspective: 1000 }}
  >
    <Tilt max={8} className='group rounded-[22px] shadow-card'>
      {/* Animated border: a light trace runs round the edge, brighter on hover. */}
      <div aria-hidden className='absolute inset-0 rounded-[22px] overflow-hidden'>
        <div className='absolute inset-0 bg-white/[0.06]' />
        <div
          className='animate-border-spin absolute inset-[-60%] opacity-70 transition-opacity duration-300 group-hover:opacity-100'
          style={{ background: `conic-gradient(from 0deg, transparent 0 62%, ${accent} 80%, #ffffff 86%, transparent 92%)` }}
        />
      </div>

      <div
        className='preserve-3d relative m-[1.5px] rounded-[21px] px-7 py-6'
        style={{ background: `radial-gradient(circle at 100% 0%, ${accent}30, transparent 55%), #151030` }}
      >
        <h3 className='pop-out-md text-white text-[22px] font-bold leading-snug'>{title}</h3>
        <p className='pop-out-sm mt-2 text-secondary text-[15px] leading-[24px]'>{description}</p>
      </div>
    </Tilt>
  </motion.div>
);

const About = () => {
  // On desktop the seated character comes from the shared <AvatarStage>
  // behind this section, so the left half is left open for it.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <div className='flex flex-col lg:flex-row lg:items-center gap-10 lg:min-h-screen'>
      <div aria-hidden className='hidden lg:block lg:w-1/2' />

      <div className='lg:w-1/2'>
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>Introduction</p>
          <h2 className={styles.sectionHeadText}>Overview.</h2>
        </motion.div>

        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className='mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]'
        >
          {profile.about}
        </motion.p>

        <motion.ul
          variants={fadeIn("", "", 0.3, 1)}
          className='mt-6 flex flex-wrap sm:flex-nowrap gap-3'
        >
          {highlights.map((highlight) => (
            <li
              key={highlight}
              className='whitespace-nowrap rounded-full border border-[#915EFF]/40 bg-tertiary/80 px-4 py-1.5 text-[13px] text-white-100'
            >
              {highlight}
            </li>
          ))}
        </motion.ul>
      </div>

      {!isDesktop && (
        <motion.div
          variants={fadeIn("up", "spring", 0.2, 1)}
          className='w-full h-[340px] sm:h-[440px]'
        >
          <AvatarCanvas pose='seated' />
        </motion.div>
      )}
    </div>
  );
};

// Cards stack down the left and slide in one at a time; on desktop the
// character stands on the right and turns to look at each new card.
const ServicesSection = () => (
  <div className='flex flex-col lg:flex-row'>
    <div className='lg:w-1/2 flex flex-col gap-8 lg:gap-[12vh] lg:pb-[20vh]'>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>What I do</p>
        <h2 className={styles.sectionHeadText}>Expertise.</h2>
      </motion.div>
      {services.map((service, index) => (
        <ServiceCard key={service.title} index={index} {...service} />
      ))}
    </div>
    <div aria-hidden className='hidden lg:block lg:w-1/2' />
  </div>
);

export const Services = SectionWrapper(ServicesSection, "services");

export default SectionWrapper(About, "about");
