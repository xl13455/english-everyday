"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  id: string;
  children: ReactNode;
};

/** 年份切换过渡。不用 AnimatePresence mode="wait"：退出等待期间新页会卡在 opacity:0，看起来像要点两下才显示。 */
export function PageMotion({ id, children }: Props) {
  return (
    <motion.div
      key={id}
      className="page-motion"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
