import React, { useRef } from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import { motion, useInView } from "framer-motion";

import "react-vertical-timeline-component/style.min.css";

import Tilt from "./Tilt";
import { HelixCanvas } from "./canvas";
import { styles } from "../styles";
import { experiences } from "../constants";
import { SectionWrapper } from "../hoc";
import { textVariant } from "../utils/motion";

const ExperienceCard = ({ experience }) => {
  // CSS transitions (opacity/transform run on the GPU) toggled by visibility,
  // so the fades stay smooth while the 3D helix renders behind them.
  const cardRef = useRef(null);
  const badgeRef = useRef(null);
  const cardVisible = useInView(cardRef, { amount: 0.3 });
  const badgeVisible = useInView(badgeRef, { amount: 0.8 });

  return (
    <VerticalTimelineElement
      // The card visuals live in <Tilt> so the whole card can tilt in 3D.
      contentStyle={{
        background: "transparent",
        boxShadow: "none",
        padding: 0,
        color: "#fff",
      }}
      contentArrowStyle={{ borderRight: "7px solid #1d1836" }}
      date={experience.date}
      iconStyle={{ background: experience.iconBg, boxShadow: "0 0 0 4px #915EFF, 0 0 25px #915EFF88" }}
      icon={
        // Badge flips like a coin as it scrolls in, and back as it leaves.
        <div
          ref={badgeRef}
          className={`flex justify-center items-center w-full h-full transition-[opacity,transform] duration-[900ms] ease-out ${
            badgeVisible ? "opacity-100 [transform:perspective(400px)_rotateY(0deg)]" : "opacity-0 [transform:perspective(400px)_rotateY(180deg)]"
          }`}
        >
          {experience.icon ? (
            <img
              src={experience.icon}
              alt={experience.company_name}
              className='w-[60%] h-[60%] object-contain'
            />
          ) : (
            <span className='text-white font-bold text-[18px] tracking-wide'>
              {experience.initials}
            </span>
          )}
        </div>
      }
    >
      {/* Fades and rises in as it enters the screen, and back out as it
          leaves, scrolling either way. */}
      <div
        ref={cardRef}
        className={`transition-[opacity,transform] duration-700 ease-out will-change-transform ${
          cardVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-14 scale-[0.96]"
        }`}
      >
        <Tilt
          max={8}
          scale={1.02}
          className='rounded-xl bg-[#1d1836]/95 border border-white/5 p-8 shadow-card'
        >
          <div className='pop-out-sm'>
            <h3 className='text-white text-[24px] font-bold'>{experience.title}</h3>
            <p
              className='text-secondary text-[16px] font-semibold'
              style={{ margin: 0 }}
            >
              {experience.company_name}
            </p>
          </div>

          <ul className='pop-out-sm mt-5 list-disc ml-5 space-y-2'>
            {experience.points.map((point, index) => (
              <li
                key={`experience-point-${index}`}
                className='text-white-100 text-[14px] pl-1 tracking-wide'
              >
                {point}
              </li>
            ))}
          </ul>
        </Tilt>
      </div>
    </VerticalTimelineElement>
  );
};

const Experience = () => {
  const timelineRef = useRef(null);

  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} text-center`}>
          What I have done so far
        </p>
        <h2 className={`${styles.sectionHeadText} text-center`}>
          Experience.
        </h2>
      </motion.div>

      <div ref={timelineRef} className='relative mt-20 flex flex-col'>
        <HelixCanvas sectionRef={timelineRef} count={experiences.length} />

        {/* Library animation off (it only plays once); cards animate themselves. */}
        <VerticalTimeline animate={false}>
          {experiences.map((experience, index) => (
            <ExperienceCard
              key={`experience-${index}`}
              experience={experience}
            />
          ))}
        </VerticalTimeline>
      </div>
    </>
  );
};

export default SectionWrapper(Experience, "work");
