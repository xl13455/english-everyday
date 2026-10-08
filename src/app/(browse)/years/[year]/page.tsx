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
  const filled =
    (content.vocab.length > 0 ? 1 : 0) +
    (content.small_essay ? 1 : 0) +
    (content.big_essay ? 1 : 0);
  const initialTab = TABS.includes(tab as SectionType)
    ? (tab as SectionType)
    : "vocab";

  return (
    <>
      <div className="year-heading">
        <h1 className="page-title">{year} 年真题</h1>
        <span className="year-heading__chip">{filled}/3 已填</span>
      </div>
      <p className="page-desc">生词 · 小作文 · 大作文</p>
      <YearSectionTabs content={content} initialTab={initialTab} />
    </>
  );
}
