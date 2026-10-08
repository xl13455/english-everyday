"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import {
  SECTION_LABELS,
  SECTION_ORDER,
  type SectionType,
} from "@/lib/constants";
import type { EssayContent, YearContent } from "@/lib/types";
import { useUpload } from "@/components/UploadProvider";
import { VocabList } from "@/components/VocabList";

type Props = {
  content: YearContent;
  initialTab?: SectionType;
};

const ease = [0.2, 0.8, 0.2, 1] as const;

function sectionFilled(content: YearContent, type: SectionType) {
  if (type === "vocab") return content.vocab.length > 0;
  if (type === "small_essay") return content.small_essay != null;
  return content.big_essay != null;
}

function EssayView({ essay }: { essay: EssayContent }) {
  const hasDraftImages = Boolean(essay.draftImageIds?.length);

  const videoSrc = essay.videoMediaId
    ? `/api/media/${essay.videoMediaId}`
    : null;

  return (
    <div className="essay-block">
      <motion.section
        className="essay-panel"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0, ease }}
      >
        <div className="essay-panel__label">题目</div>
        <div className="essay-panel__body">{essay.prompt}</div>
      </motion.section>

      {essay.imageIds && essay.imageIds.length > 0 ? (
        <motion.section
          className="essay-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.05, ease }}
        >
          <div className="essay-panel__label">题目配图</div>
          <div className="essay-panel__body essay-panel__body--images">
            {essay.imageIds.map((id) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={id}
                className="essay-image"
                src={`/api/media/${id}`}
                alt="题目配图"
              />
            ))}
          </div>
        </motion.section>
      ) : null}

      <motion.section
        className="essay-panel essay-panel--draft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.1, ease }}
      >
        <div className="essay-panel__label">我的作文</div>
        {hasDraftImages ? (
          <div className="essay-panel__body essay-panel__body--images">
            {essay.draftImageIds!.map((id) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={id}
                className="essay-image"
                src={`/api/media/${id}`}
                alt="我的作文"
              />
            ))}
          </div>
        ) : (
          <div className="essay-panel__body essay-video-empty">暂无作文图片</div>
        )}
      </motion.section>

      <motion.section
        className="essay-panel essay-panel--revised"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.14, ease }}
      >
        <div className="essay-panel__label">修改后范文</div>
        <div className="essay-panel__body">{essay.revised}</div>
      </motion.section>

      <motion.section
        className="essay-panel essay-panel--video"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.16, ease }}
      >
        <div className="essay-panel__label">讲解视频</div>
        <div className="essay-panel__body essay-panel__body--video">
          {videoSrc ? (
            <video
              className="essay-video"
              src={videoSrc}
              controls
              playsInline
              preload="metadata"
            >
              您的浏览器不支持视频播放。
            </video>
          ) : (
            <p className="essay-video-empty">暂无讲解视频</p>
          )}
        </div>
      </motion.section>

      {essay.notes ? (
        <motion.section
          className="essay-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.2, ease }}
        >
          <div className="essay-panel__label">要点</div>
          <div className="essay-panel__body">{essay.notes}</div>
        </motion.section>
      ) : null}
    </div>
  );
}

export function YearSectionTabs({ content, initialTab = "vocab" }: Props) {
  const [tab, setTab] = useState<SectionType>(initialTab);
  const { openUpload } = useUpload();
  const tabFilled = sectionFilled(content, tab);

  useEffect(() => {
    setTab(initialTab);
  }, [content.year, initialTab]);

  const body = useMemo(() => {
    if (tab === "vocab") {
      if (content.vocab.length === 0) {
        return (
          <Empty
            tip="还没有生词，上传后会显示在这里。"
            onUpload={() =>
              openUpload({ year: content.year, type: "vocab" })
            }
          />
        );
      }
      return <VocabList items={content.vocab} year={content.year} />;
    }

    const essay =
      tab === "small_essay" ? content.small_essay : content.big_essay;
    if (!essay) {
      return (
        <Empty
          tip={`还没有${SECTION_LABELS[tab]}内容。`}
          onUpload={() => openUpload({ year: content.year, type: tab })}
        />
      );
    }

    return <EssayView essay={essay} />;
  }, [content, openUpload, tab]);

  return (
    <LayoutGroup id={`year-tabs-${content.year}`}>
      <div className="section-tabs" role="tablist">
        {SECTION_ORDER.map((key) => {
          const filled = sectionFilled(content, key);
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`section-tab${active ? " section-tab--active" : ""}`}
              onClick={() => setTab(key)}
            >
              {active ? (
                <motion.span
                  layoutId="section-tab-underline"
                  className="section-tab__underline"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              ) : null}
              <span className="section-tab__label">{SECTION_LABELS[key]}</span>
              <span
                className={`section-tab__badge${filled ? " section-tab__badge--on" : ""}`}
                aria-hidden
              />
            </button>
          );
        })}
        <button
          type="button"
          className="btn btn--secondary section-tabs__upload"
          onClick={() => openUpload({ year: content.year, type: tab })}
        >
          {tabFilled ? "编辑" : "上传"}
          {SECTION_LABELS[tab]}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${content.year}-${tab}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </LayoutGroup>
  );
}

function Empty({ tip, onUpload }: { tip: string; onUpload: () => void }) {
  return (
    <div className="empty-state">
      <p>{tip}</p>
      <button type="button" className="btn btn--primary" onClick={onUpload}>
        去上传
      </button>
    </div>
  );
}
