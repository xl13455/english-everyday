"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { VocabItem } from "@/lib/types";

/** 双栏时约 5 行，尽量一屏看完 */
const PAGE_SIZE = 10;
const ease = [0.2, 0.8, 0.2, 1] as const;

type Props = {
  items: VocabItem[];
  year: number;
};

type IndexedItem = {
  item: VocabItem;
  /** 原列表中的 0-based 序号，用于展示全局排序号 */
  order: number;
};

export function VocabList({ items, year }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipScrollRef = useRef(true);

  const filtered = useMemo(() => filterItems(items, query), [items, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = Math.max(1, Math.ceil(Math.min(filtered.length, PAGE_SIZE) / 2));

  useEffect(() => {
    skipScrollRef.current = true;
    setQuery("");
    setPage(1);
  }, [year]);

  useEffect(() => {
    skipScrollRef.current = true;
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    if (totalPages <= 1) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setPage((p) => Math.max(1, p - 1));
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setPage((p) => Math.min(totalPages, p + 1));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pageNumbers = useMemo(
    () => buildPageNumbers(page, totalPages),
    [page, totalPages],
  );

  function goTo(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages));
  }

  const trimmed = query.trim();

  return (
    <div className="vocab-pager" ref={rootRef}>
      <div className="vocab-pager__toolbar">
        <label className="vocab-search">
          <span className="visually-hidden">搜索本年生词</span>
          <input
            className="vocab-search__input"
            type="search"
            value={query}
            placeholder="搜索本年单词…"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setQuery(e.target.value)}
          />
          {trimmed ? (
            <button
              type="button"
              className="vocab-search__clear"
              aria-label="清除搜索"
              onClick={() => setQuery("")}
            >
              ×
            </button>
          ) : null}
        </label>

        {totalPages > 1 ? (
          <nav
            className="vocab-pager__nav"
            aria-label="生词分页，可用左右方向键翻页"
          >
            <button
              type="button"
              className="btn btn--secondary vocab-pager__btn"
              disabled={page <= 1}
              onClick={() => goTo(page - 1)}
            >
              上一页
            </button>
            <div className="vocab-pager__pages">
              {pageNumbers.map((n, i) =>
                n === "…" ? (
                  <span key={`e-${i}`} className="vocab-pager__ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    className={`vocab-pager__page${n === page ? " vocab-pager__page--active" : ""}`}
                    aria-current={n === page ? "page" : undefined}
                    onClick={() => goTo(n)}
                  >
                    {n}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              className="btn btn--secondary vocab-pager__btn"
              disabled={page >= totalPages}
              onClick={() => goTo(page + 1)}
            >
              下一页
            </button>
          </nav>
        ) : null}
      </div>

      {pageItems.length === 0 ? (
        <div className="vocab-empty">
          {trimmed ? `未找到与「${trimmed}」相关的单词` : "暂无生词"}
        </div>
      ) : (
        <div
          className="vocab-list"
          style={{ gridTemplateRows: `repeat(${rows}, auto)` }}
        >
          {pageItems.map(({ item, order }, index) => (
            <motion.article
              key={`${year}-${order}-${item.word}`}
              className="vocab-item"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                delay: Math.min(index, 6) * 0.03,
                ease,
              }}
            >
              <span className="vocab-item__index" aria-hidden="true">
                {order + 1}
              </span>
              <div className="vocab-item__body">
                <div className="vocab-item__head">
                  <span className="vocab-item__word">{item.word}</span>
                  {item.pos ? (
                    <span className="vocab-item__pos">{item.pos}</span>
                  ) : null}
                  {item.phonetic ? (
                    <span className="vocab-item__phonetic">{item.phonetic}</span>
                  ) : null}
                </div>
                <p className="vocab-item__meaning">{item.meaning}</p>
                {item.discrimination ? (
                  <p
                    className="vocab-item__discrimination"
                    title={item.discrimination}
                  >
                    <span className="vocab-item__label">辨析</span>
                    {item.discrimination}
                  </p>
                ) : null}
                {item.word_family ? (
                  <p className="vocab-item__family" title={item.word_family}>
                    <span className="vocab-item__label">词族</span>
                    {item.word_family}
                  </p>
                ) : null}
                {item.collocation ? (
                  <p className="vocab-item__collocation" title={item.collocation}>
                    <span className="vocab-item__label">搭配</span>
                    {item.collocation}
                  </p>
                ) : null}
                {item.example ? (
                  <p
                    className="vocab-item__example"
                    title={
                      item.example_zh
                        ? `${item.example} / ${item.example_zh}`
                        : item.example
                    }
                  >
                    <span className="vocab-item__label">例</span>
                    {item.example}
                    {item.example_zh ? (
                      <span className="vocab-item__example-zh">
                        {" "}
                        / {item.example_zh}
                      </span>
                    ) : null}
                  </p>
                ) : item.example_zh ? (
                  <p className="vocab-item__example" title={item.example_zh}>
                    <span className="vocab-item__label">例</span>
                    {item.example_zh}
                  </p>
                ) : null}
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}

function filterItems(items: VocabItem[], query: string): IndexedItem[] {
  const q = query.trim().toLowerCase();
  const indexed = items.map((item, order) => ({ item, order }));
  if (!q) return indexed;

  return indexed.filter(({ item }) => {
    const haystack = [
      item.word,
      item.pos,
      item.phonetic,
      item.meaning,
      item.discrimination,
      item.word_family,
      item.collocation,
      item.example,
      item.example_zh,
    ]
      .filter(Boolean)
      .join("\n")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function buildPageNumbers(current: number, total: number): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current]);
  for (let d = 1; d <= 1; d++) {
    if (current - d >= 1) pages.add(current - d);
    if (current + d <= total) pages.add(current + d);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}
