import type { ReactNode } from "react";
import { BrowseFrame } from "@/components/BrowseFrame";
import { listYearSummaries } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BrowseLayout({
  children,
}: {
  children: ReactNode;
}) {
  const years = await listYearSummaries();
  return <BrowseFrame years={years}>{children}</BrowseFrame>;
}
