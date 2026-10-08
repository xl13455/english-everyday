"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  id: string;
  children: ReactNode;
};

export function PageMotion({ id, children }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        className="page-motion"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
