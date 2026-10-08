import type { SectionType } from "./constants";

export type VocabItem = {
  word: string;
  pos?: string;
  phonetic?: string;
  meaning: string;
  example?: string;
};

export type EssayContent = {
  prompt: string;
  /** 文本版我的作文（可空，手写扫描常用图片） */
  draft: string;
  revised: string;
  notes?: string;
  videoUrl?: string;
  /** 题目配图 */
  imageIds?: number[];
  /** 我的作文图片 */
  draftImageIds?: number[];
  videoMediaId?: number | null;
};

export type YearContent = {
  year: number;
  vocab: VocabItem[];
  small_essay: EssayContent | null;
  big_essay: EssayContent | null;
};

export type YearSummary = {
  year: number;
  status: Record<SectionType, boolean>;
  filled: number;
  total: number;
};

export type VocabDraftItem = VocabItem & { key: string };

export type EssayFormValues = {
  prompt: string;
  draft: string;
  revised: string;
  notes: string;
  draftImageIds: number[];
  imageIds: number[];
  videoMediaId: number | null;
};
