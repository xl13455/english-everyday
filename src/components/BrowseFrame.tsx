"use client";

import { usePathname } from "next/navigation";
import { LayoutGroup } from "motion/react";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PageMotion } from "@/components/PageMotion";
import { UploadProvider } from "@/components/UploadProvider";
import { YearSidebar } from "@/components/YearSidebar";
import type { YearSummary } from "@/lib/types";

type Props = {
  years: YearSummary[];
  children: ReactNode;
};

export function BrowseFrame({ years, children }: Props) {
  const pathname = usePathname();
  const matched = pathname.match(/^\/years\/(\d+)/);
  const activeYear = matched ? Number(matched[1]) : null;
  const pageId = activeYear != null ? `year-${activeYear}` : "home";

  return (
    <UploadProvider defaultYear={activeYear ?? 2024}>
      <AppHeader />
      <div className="browse-layout">
        <LayoutGroup id="browse">
          <YearSidebar years={years} activeYear={activeYear} />
          <main className="app-main app-main--with-sidebar">
            <PageMotion id={pageId}>{children}</PageMotion>
          </main>
        </LayoutGroup>
      </div>
    </UploadProvider>
  );
}
