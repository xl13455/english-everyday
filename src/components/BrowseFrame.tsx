"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PageMotion } from "@/components/PageMotion";
import { UploadProvider } from "@/components/UploadProvider";
import { YearSidebar } from "@/components/YearSidebar";
import type { YearSummary } from "@/lib/types";

type Props = {
  years: YearSummary[];
  passwordRequired?: boolean;
  children: ReactNode;
};

export function BrowseFrame({
  years,
  passwordRequired = false,
  children,
}: Props) {
  const pathname = usePathname();
  const matched = pathname.match(/^\/years\/(\d+)/);
  const activeYear = matched ? Number(matched[1]) : null;
  const pageId = activeYear != null ? `year-${activeYear}` : "home";

  return (
    <UploadProvider
      defaultYear={activeYear ?? 2024}
      passwordRequired={passwordRequired}
    >
      <AppHeader />
      <div className="browse-layout">
        <YearSidebar years={years} activeYear={activeYear} />
        <main className="app-main app-main--with-sidebar">
          <PageMotion id={pageId}>{children}</PageMotion>
        </main>
      </div>
    </UploadProvider>
  );
}
