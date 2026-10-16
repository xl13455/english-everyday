"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SECTION_ORDER } from "@/lib/constants";
import type { YearSummary } from "@/lib/types";

type Props = {
  years: YearSummary[];
  activeYear?: number | null;
};

export function YearSidebar({ years, activeYear = null }: Props) {
  const router = useRouter();

  return (
    <aside className="year-sidebar" aria-label="年份列表">
      <div className="year-sidebar__title">年份</div>
      <nav className="year-sidebar__nav">
        {years.map(({ year, status }) => {
          const active = activeYear === year;
          const href = `/years/${year}`;
          return (
            <Link
              key={year}
              href={href}
              className={`year-sidebar__item${active ? " year-sidebar__item--active" : ""}`}
              aria-current={active ? "page" : undefined}
              // 侧栏可滚动时，轻微位移会吞掉 click（表现为要点两下）。
              // 在 pointerdown 立即 push，避免被当成拖拽滚动。
              onPointerDown={(e) => {
                if (e.pointerType === "mouse" && e.button !== 0) return;
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                if (active) return;
                e.preventDefault();
                router.push(href);
              }}
            >
              <span className="year-sidebar__active-bg" aria-hidden />
              <span className="year-sidebar__year">{year}</span>
              <span className="year-sidebar__dots" aria-hidden>
                {SECTION_ORDER.map((key) => (
                  <span
                    key={key}
                    className={`dot${status[key] ? " dot--on" : ""}`}
                  />
                ))}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
