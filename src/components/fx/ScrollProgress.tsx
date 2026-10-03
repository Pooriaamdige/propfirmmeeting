"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin orange→gold reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return <motion.div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-right bg-linear-to-l from-accent via-accent-2 to-accent" style={{ scaleX }} />;
}
