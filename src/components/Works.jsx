import React, { useEffect, useRef } from "react";
import { motion, useAnimationFrame, useReducedMotion } from "framer-motion";

import Tilt from "./Tilt";
import { styles } from "../styles";
import { github } from "../assets";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";
import { fadeIn, textVariant } from "../utils/motion";
import { useInView } from "../hooks";

const SPEED = 85; // px per second
const DRAG_THRESHOLD = 6; // px before a press counts as a drag, not a click

// Cover gradients for projects without a screenshot, cycled by card index.
const coverGradients = [
  ["#804dee", "#1d1836"],
  ["#00cea8", "#151030"],
  ["#bf61ff", "#100d25"],
  ["#2f80ed", "#151030"],
  ["#ec008c", "#1d1836"],
  ["#f5af19", "#100d25"],
];

const ProjectCover = ({ index, name }) => {
  const [from, to] = coverGradients[index % coverGradients.length];

  return (
    <div
      className='relative w-full h-full rounded-2xl overflow-hidden flex flex-col justify-end p-5'
      style={{ background: `radial-gradient(circle at 20% 15%, ${from}, ${to} 75%)` }}
    >
      {/* Faint grid for texture. */}
      <div
        aria-hidden
        className='absolute inset-0 opacity-20'
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <h4 className='relative text-white text-[24px] font-black leading-tight'>{name}</h4>
    </div>
  );
};

const ProjectCard = ({ index, name, description, image, links = [], hidden = false }) => (
  <Tilt max={8} wrapperClassName='h-full' className='h-full flex flex-col bg-tertiary p-5 rounded-2xl'>
    <div className='pop-out-sm relative w-full h-[150px] shrink-0'>
      {image ? (
        <img src={image} alt={name} loading='lazy' draggable={false} className='w-full h-full object-cover rounded-2xl' />
      ) : (
        <ProjectCover index={index} name={name} />
      )}
    </div>

    {/* The cover carries the name, so the body is just the summary. */}
    <p className='pop-out-sm mt-4 text-secondary text-[14px] leading-[22px]'>{description}</p>

    {/* Links sit at the bottom so every card lines up. */}
    {links.length > 0 && (
      <div className='mt-auto pt-4 flex flex-wrap gap-2'>
        {links.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            tabIndex={hidden ? -1 : undefined}
            draggable={false}
            className='inline-flex items-center gap-1.5 rounded-full border border-[#915EFF]/50 bg-black-100 px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#915EFF]/25'
          >
            {label === "GitHub" && <img src={github} alt='' className='w-3.5 h-3.5' />}
            {label} <span aria-hidden>↗</span>
          </a>
        ))}
      </div>
    )}
  </Tilt>
);

/**
 * Endless horizontal slider with a 3D "curved" feel: cards near the centre
 * come forward, cards towards the edges turn and recede. It pauses while
 * hovered or focused and can be dragged or swiped. Transforms are written
 * straight to the DOM each frame, so React never re-renders while it runs.
 */
const ProjectMarquee = ({ items }) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const layout = useRef({ half: 0, width: 0, centres: [] });
  const offset = useRef(0);
  const paused = useRef(false);
  const drag = useRef(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(containerRef);
  const loop = [...items, ...items];

  // Measure once (and on resize): one set's width and each card's centre.
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      layout.current = {
        half: track.scrollWidth / 2,
        width: containerRef.current.clientWidth,
        centres: cardRefs.current.map((el) => (el ? el.offsetLeft + el.offsetWidth / 2 : 0)),
      };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [items.length]);

  useAnimationFrame((_, delta) => {
    if (!inView) return;
    const { half, width, centres } = layout.current;
    if (!half) return;

    if (!paused.current && !drag.current && !reduceMotion) offset.current -= (SPEED * delta) / 1000;
    // Wrap so the duplicate set takes over seamlessly.
    if (offset.current <= -half) offset.current += half;
    if (offset.current > 0) offset.current -= half;
    trackRef.current.style.transform = `translate3d(${offset.current}px, 0, 0)`;

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const n = Math.max(-1.6, Math.min(1.6, (centres[i] + offset.current - width / 2) / (width / 2)));
      const a = Math.abs(n);
      el.style.transform = `perspective(1400px) rotateY(${-n * 16}deg) translateZ(${-a * 70}px) scale(${1 - a * 0.05})`;
      el.style.opacity = String(1 - Math.max(0, a - 1) * 0.8);
    });
  });

  const onPointerDown = (event) => {
    drag.current = { x: event.clientX, start: offset.current, moved: false };
  };
  const onPointerMove = (event) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.x;
    if (Math.abs(dx) > DRAG_THRESHOLD) d.moved = true;
    if (d.moved) offset.current = d.start + dx;
  };
  const endDrag = () => {
    // Keep the flag for the click that follows a drag, then clear it.
    const d = drag.current;
    drag.current = null;
    if (d?.moved) {
      containerRef.current.dataset.dragged = "1";
      setTimeout(() => delete containerRef.current?.dataset.dragged, 0);
    }
  };
  const onClickCapture = (event) => {
    if (containerRef.current.dataset.dragged) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div
      ref={containerRef}
      className='relative overflow-hidden py-10 cursor-grab active:cursor-grabbing select-none touch-pan-y'
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => {
        paused.current = false;
        endDrag();
      }}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
    >
      {/* Edge fades. Overlays rather than a CSS mask: masks can make 3D
          transformed content disappear on some GPUs. */}
      <div aria-hidden className='pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-24 bg-gradient-to-r from-primary to-transparent' />
      <div aria-hidden className='pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-24 bg-gradient-to-l from-primary to-transparent' />

      <div ref={trackRef} className='flex w-max items-stretch will-change-transform'>
        {loop.map((project, i) => (
          <div
            key={`${project.name}-${i}`}
            ref={(el) => (cardRefs.current[i] = el)}
            aria-hidden={i >= items.length || undefined}
            className='mr-7 w-[290px] sm:w-[340px] shrink-0 will-change-transform'
          >
            <ProjectCard index={i % items.length} hidden={i >= items.length} {...project} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Works = () => (
  <>
    <motion.div variants={textVariant()}>
      <p className={`${styles.sectionSubText} `}>My work</p>
      <h2 className={`${styles.sectionHeadText}`}>Projects.</h2>
    </motion.div>

    <motion.div variants={fadeIn("up", "spring", 0.2, 0.75)} className='mt-10'>
      <ProjectMarquee items={projects} />
      <p className='text-center text-[13px] text-secondary'>
        <span className='hidden sm:inline'>Hover to pause · drag to explore</span>
        <span className='sm:hidden'>Swipe to explore</span>
      </p>
    </motion.div>
  </>
);

export default SectionWrapper(Works, "projects");
