"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * A thin signal-orange progress bar fixed to the top of the viewport
 * that fills as the user scrolls down the page.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 origin-left z-[60] bg-signal"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
