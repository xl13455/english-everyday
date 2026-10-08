import { notFound } from "next/navigation";
import { YearSectionTabs } from "@/components/YearSectionTabs";
import { YEAR_END, YEAR_START, type SectionType } from "@/lib/constants";
import { getYearContent } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const TABS: SectionType[] = ["vocab", "small_essay", "big_essay"];

export default async function YearPage({ params, searchParams }: Props) {
  const { year: yearStr } = await params;
  const { tab } = await searchParams;
  const year = Number(yearStr);

  if (!Number.isInteger(year) || year < YEAR_START || year > YEAR_END) {
    notFound();
  }

  const content = await getYearContent(year);
  const initialTab = TABS.includes(tab as SectionType)
    ? (tab as SectionType)
    : "vocab";

  return (
    <>
      <h1 className="page-title">{year} 年真题</h1>
      <YearSectionTabs content={content} initialTab={initialTab} />
    </>
  );
}
