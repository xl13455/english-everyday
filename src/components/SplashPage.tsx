"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { YEAR_END, YEAR_START, YEARS } from "@/lib/constants";
import {
  hasEnteredThisSession,
  markEnteredThisSession,
} from "@/lib/entry-session";

const ease = [0.22, 1, 0.36, 1] as const;
const BRAND = "考研英语真题";

/** 背景里轻轻漂的年份，只取几枚避免杂乱 */
const FLOAT_YEARS = [YEARS[0], YEARS[3], YEARS[6], YEARS[10], YEARS[YEARS.length - 1]].filter(
  (y, i, arr) => y != null && arr.indexOf(y) === i,
);

export function SplashPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasEnteredThisSession()) {
      router.replace(`/years/${YEAR_END}`);
      return;
    }
    setReady(true);
  }, [router]);

  function enter() {
    markEnteredThisSession();
    router.push(`/years/${YEAR_END}`);
  }

  if (!ready) {
    return <div className="splash splash--boot" aria-hidden />;
  }

  return (
    <div className="splash">
      <div className="splash__wash" aria-hidden />
      <motion.div
        className="splash__orb splash__orb--a"
        aria-hidden
        animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="splash__orb splash__orb--b"
        aria-hidden
        animate={{ y: [0, 22, 0], x: [0, -14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="splash__grain" aria-hidden />

      <div className="splash__float-years" aria-hidden>
        {FLOAT_YEARS.map((year, i) => (
          <motion.span
            key={year}
            className={`splash__float-year splash__float-year--${i}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{
              opacity: [0.12, 0.22, 0.12],
              y: [0, i % 2 === 0 ? -10 : 12, 0],
            }}
            transition={{
              opacity: { duration: 5 + i, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 7 + i * 0.6, repeat: Infinity, ease: "easeInOut" },
              delay: 0.4 + i * 0.12,
            }}
          >
            {year}
          </motion.span>
        ))}
      </div>

      <div className="splash__content">
        <motion.span
          className="splash__mark"
          initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
        >
          英
        </motion.span>

        <h1 className="splash__brand" aria-label={BRAND}>
          {BRAND.split("").map((ch, i) => (
            <motion.span
              key={`${ch}-${i}`}
              className="splash__brand-char"
              initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.55, delay: 0.18 + i * 0.055, ease }}
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="splash__tagline"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease }}
        >
          <span>{YEAR_START}–{YEAR_END}</span>
          <span className="splash__dot" aria-hidden />
          <span>生词</span>
          <span className="splash__slash" aria-hidden>
            /
          </span>
          <span>小作文</span>
          <span className="splash__slash" aria-hidden>
            /
          </span>
          <span>大作文</span>
        </motion.p>

        <motion.button
          type="button"
          className="splash__cta"
          onClick={enter}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.72, ease }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <span>进入真题</span>
          <motion.span
            className="splash__cta-arrow"
            aria-hidden
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            →
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
}
