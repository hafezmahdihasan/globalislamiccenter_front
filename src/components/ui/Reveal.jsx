"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Subtle one-time fade/slide-in. Disabled when the visitor prefers reduced motion. */
export default function Reveal({ children, delay = 0, className }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}
