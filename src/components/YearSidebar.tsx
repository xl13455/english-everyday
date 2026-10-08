"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SECTION_ORDER } from "@/lib/constants";
import type { YearSummary } from "@/lib/types";

type Props = {
  years: YearSummary[];
  activeYear?: number | null;
};

export function YearSidebar({ years, activeYear = null }: Props) {
  return (
    <aside className="year-sidebar" aria-label="年份列表">
      <div className="year-sidebar__title">年份</div>
      <nav className="year-sidebar__nav">
        {years.map(({ year, status, filled }) => {
          const active = activeYear === year;
          return (
            <Link
              key={year}
              href={`/years/${year}`}
              className={`year-sidebar__item${active ? " year-sidebar__item--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <motion.span
                  layoutId="year-active-bg"
                  className="year-sidebar__active-bg"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              ) : null}
              <span className="year-sidebar__year">{year}</span>
              <span className="year-sidebar__dots" aria-hidden>
                {SECTION_ORDER.map((key) => (
                  <span
                    key={key}
                    className={`dot${status[key] ? " dot--on" : ""}`}
                  />
                ))}
              </span>
              <span className="year-sidebar__meta">{filled}/3</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
