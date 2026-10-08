export const YEAR_START = 2010;
export const YEAR_END = 2026;

export const YEARS = Array.from(
  { length: YEAR_END - YEAR_START + 1 },
  (_, i) => YEAR_START + i,
).reverse();

export type SectionType = "vocab" | "small_essay" | "big_essay";

export const SECTION_LABELS: Record<SectionType, string> = {
  vocab: "生词",
  small_essay: "小作文",
  big_essay: "大作文",
};

export const SECTION_ORDER: SectionType[] = [
  "vocab",
  "small_essay",
  "big_essay",
];
