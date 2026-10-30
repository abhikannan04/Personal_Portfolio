import React from "react";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { TechCanvas } from "./canvas";
import { SectionWrapper } from "../hoc";
import { technologies } from "../constants";
import { textVariant } from "../utils/motion";

const Tech = () => {
  return (
    <>
      <motion.div variants={textVariant()} className='mb-10 text-center'>
        <h2 className={styles.sectionHeadText}>Tech Stack.</h2>
      </motion.div>

      <TechCanvas technologies={technologies} />
    </>
  );
};

export default SectionWrapper(Tech, "tech");
