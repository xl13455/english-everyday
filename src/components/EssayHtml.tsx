"use client";

import { useMemo } from "react";
import {
  isEssayHtml,
  plainTextToEssayHtml,
  sanitizeEssayHtml,
} from "@/lib/essay-html";

type Props = {
  value?: string | null;
  className?: string;
  empty?: string;
};

export function EssayHtml({
  value,
  className = "essay-panel__body",
  empty,
}: Props) {
  const raw = value || "";
  const html = useMemo(() => {
    if (!raw.trim()) return "";
    // 历史纯文本按换行拆成段落，与编辑器 TipTap 观感一致
    const source = isEssayHtml(raw) ? raw : plainTextToEssayHtml(raw);
    return sanitizeEssayHtml(source);
  }, [raw]);

  if (!raw.trim()) {
    return empty ? <div className={className}>{empty}</div> : null;
  }

  return (
    <div
      className={`${className} essay-panel__body--html`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
