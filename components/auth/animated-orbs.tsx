"use client";

import { motion } from "framer-motion";

export function AnimatedOrbs() {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-400/20 dark:bg-cyan-500/10 blur-3xl"
        animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-teal-400/20 dark:bg-teal-500/10 blur-3xl"
        animate={{ x: [0, -22, 0], y: [0, 14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3/4 w-48 h-48 rounded-full bg-sky-300/15 dark:bg-sky-400/8 blur-2xl"
        animate={{ x: [0, 12, 0], y: [0, -22, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}
