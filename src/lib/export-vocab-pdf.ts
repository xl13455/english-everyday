import type { VocabItem } from "./types";

/** 每页 20 词：左栏 1–10，右栏 11–20 */
const PER_PAGE = 20;
const PER_COL = 10;

/** 页面内容区像素（约 A4 可印区域） */
const PAGE_WIDTH_PX = 720;
const PAGE_HEIGHT_PX = 1040;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clip(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function renderItem(item: VocabItem, order: number): string {
  const lines: string[] = [];
  lines.push(
    `<div class="head"><span class="idx">${order}.</span>` +
      `<span class="word">${escapeHtml(item.word)}</span>` +
      (item.pos ? `<span class="pos">${escapeHtml(item.pos)}</span>` : "") +
      (item.phonetic
        ? `<span class="ph">${escapeHtml(item.phonetic)}</span>`
        : "") +
      `</div>`,
  );
  lines.push(
    `<div class="meaning">${escapeHtml(clip(item.meaning, 72))}</div>`,
  );
  if (item.discrimination) {
    lines.push(
      `<div class="meta"><b>辨析</b> ${escapeHtml(clip(item.discrimination, 56))}</div>`,
    );
  }
  if (item.word_family) {
    lines.push(
      `<div class="meta"><b>词族</b> ${escapeHtml(clip(item.word_family, 56))}</div>`,
    );
  }
  if (item.collocation) {
    lines.push(
      `<div class="meta"><b>搭配</b> ${escapeHtml(clip(item.collocation, 56))}</div>`,
    );
  }
  if (item.example || item.example_zh) {
    const ex = [item.example, item.example_zh].filter(Boolean).join(" / ");
    lines.push(
      `<div class="meta"><b>例</b> ${escapeHtml(clip(ex, 70))}</div>`,
    );
  }
  return `<div class="item">${lines.join("")}</div>`;
}

function buildPageHtml(
  year: number,
  total: number,
  pageItems: VocabItem[],
  startIndex: number,
  pageNo: number,
  pageCount: number,
): string {
  const left = pageItems.slice(0, PER_COL);
  const right = pageItems.slice(PER_COL, PER_PAGE);

  const leftHtml = left
    .map((item, i) => renderItem(item, startIndex + i + 1))
    .join("");
  const rightHtml = right
    .map((item, i) => renderItem(item, startIndex + PER_COL + i + 1))
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    margin: 0;
    background: #fff;
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
      "Noto Sans SC", "Source Han Sans SC", sans-serif;
    color: #111;
  }
  .page {
    width: ${PAGE_WIDTH_PX}px;
    height: ${PAGE_HEIGHT_PX}px;
    padding: 16px 18px 14px;
    overflow: hidden;
    background: #fff;
    display: flex;
    flex-direction: column;
  }
  .header {
    flex: 0 0 auto;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 8px;
    margin-bottom: 10px;
    border-bottom: 1px solid #ccc;
  }
  h1 {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
  }
  .sub { font-size: 11px; font-weight: 400; color: #666; margin-left: 6px; }
  .page-no { font-size: 11px; color: #888; white-space: nowrap; }
  .cols {
    flex: 1 1 auto;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 14px;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 0;
    min-width: 0;
  }
  .col + .col {
    padding-left: 14px;
    border-left: 1px solid #e6e6e6;
  }
  .item {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    padding: 3px 0 4px;
    border-bottom: 1px solid #eceff3;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 6px;
    margin-bottom: 1px;
  }
  .idx {
    color: #888;
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    min-width: 1.7em;
  }
  .word { font-size: 12px; font-weight: 700; }
  .pos { color: #1a73e8; font-size: 10px; }
  .ph { color: #666; font-size: 10px; }
  .meaning {
    font-size: 10.5px;
    line-height: 1.35;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .meta {
    margin-top: 1px;
    font-size: 9.5px;
    line-height: 1.3;
    color: #444;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .meta b {
    display: inline-block;
    margin-right: 3px;
    padding: 0 2px;
    border: 1px solid #ccc;
    border-radius: 2px;
    font-weight: 500;
    font-size: 9px;
  }
</style></head><body>
  <div class="page">
    <div class="header">
      <h1>${year} 年考研英语生词<span class="sub">共 ${total} 词</span></h1>
      <span class="page-no">${pageNo} / ${pageCount}</span>
    </div>
    <div class="cols">
      <div class="col">${leftHtml}</div>
      <div class="col">${rightHtml}</div>
    </div>
  </div>
</body></html>`;
}

/** 本页生成并下载全年生词 PDF：每页 20 词，左 10 右 10，不跳转、不越界 */
export async function exportVocabPdf(year: number, items: VocabItem[]) {
  if (items.length === 0) {
    throw new Error("该年暂无生词可导出");
  }

  const [{ jsPDF }, html2canvas] = await Promise.all([
    import("jspdf"),
    import("html2canvas").then((m) => m.default),
  ]);

  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${PAGE_WIDTH_PX + 40}px;height:${PAGE_HEIGHT_PX + 40}px;border:0;opacity:0;pointer-events:none;`;
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("无法创建导出文档");
  }

  try {
    for (let pageNo = 1; pageNo <= pageCount; pageNo++) {
      const start = (pageNo - 1) * PER_PAGE;
      const pageItems = items.slice(start, start + PER_PAGE);

      doc.open();
      doc.write(
        buildPageHtml(year, items.length, pageItems, start, pageNo, pageCount),
      );
      doc.close();
      await new Promise((r) => setTimeout(r, 40));

      const pageEl = doc.querySelector(".page") as HTMLElement | null;
      if (!pageEl) throw new Error("导出排版失败");

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: PAGE_WIDTH_PX,
        height: PAGE_HEIGHT_PX,
        windowWidth: PAGE_WIDTH_PX,
        windowHeight: PAGE_HEIGHT_PX,
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      if (pageNo > 1) pdf.addPage();
      pdf.addImage(
        dataUrl,
        "JPEG",
        margin,
        margin,
        pageWidth - margin * 2,
        pageHeight - margin * 2,
      );
    }
  } finally {
    document.body.removeChild(iframe);
  }

  pdf.save(`${year}-考研英语生词.pdf`);
}
