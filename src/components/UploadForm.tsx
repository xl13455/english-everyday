"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  SECTION_LABELS,
  SECTION_ORDER,
  YEARS,
  type SectionType,
} from "@/lib/constants";
import type { VocabDraftItem } from "@/lib/types";
import { createEmptyVocabDraft } from "@/lib/vocab-utils";
import { uploadWithProgress } from "@/lib/upload-with-progress";
import { EssayEditor } from "@/components/EssayEditor";
import { ImagePickerField } from "@/components/ImagePickerField";
import { VideoPickerField } from "@/components/VideoPickerField";
import { VocabEditor } from "@/components/VocabEditor";

type Props = {
  defaultYear?: number;
  defaultType?: SectionType;
  onDone?: () => void;
};

export function UploadForm({
  defaultYear = 2024,
  defaultType = "vocab",
  onDone,
}: Props) {
  const router = useRouter();
  const [year, setYear] = useState(defaultYear);
  const [type, setType] = useState<SectionType>(defaultType);
  const [vocabItems, setVocabItems] = useState<VocabDraftItem[]>([
    createEmptyVocabDraft(),
  ]);
  const [prompt, setPrompt] = useState("");
  const [revised, setRevised] = useState("");
  const [notes, setNotes] = useState("");
  const [draftImageIds, setDraftImageIds] = useState<number[]>([]);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [videoMediaId, setVideoMediaId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const yearOptions = useMemo(() => YEARS, []);
  const isVocab = type === "vocab";

  useEffect(() => {
    let cancelled = false;
    async function loadSeed() {
      setSeedLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/content/${year}?type=${type}`);
        if (!res.ok) throw new Error("加载已有内容失败");
        const seed = await res.json();
        if (cancelled) return;
        setIsEdit(Boolean(seed.isEdit));
        setVocabItems(
          seed.vocabItems?.length
            ? seed.vocabItems
            : [createEmptyVocabDraft()],
        );
        setPrompt(seed.essay?.prompt ?? "");
        setRevised(seed.essay?.revised ?? "");
        setNotes(seed.essay?.notes ?? "");
        setDraftImageIds(seed.essay?.draftImageIds ?? []);
        setImageIds(seed.essay?.imageIds ?? []);
        setVideoMediaId(seed.essay?.videoMediaId ?? null);
        setMessage(null);
        setProgress(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "加载失败");
        }
      } finally {
        if (!cancelled) setSeedLoading(false);
      }
    }
    loadSeed();
    return () => {
      cancelled = true;
    };
  }, [year, type]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setProgress(null);

    if (isVocab) {
      const valid = vocabItems.filter(
        (item) => item.word.trim() && item.meaning.trim(),
      );
      if (valid.length === 0) {
        setError("请至少填写一条完整生词（单词 + 释义）。");
        return;
      }
    }

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    form.set("year", String(year));
    form.set("type", type);
    if (password) form.set("password", password);

    if (isVocab) {
      const payload = vocabItems
        .filter((item) => item.word.trim() && item.meaning.trim())
        .map(
          ({
            word,
            pos,
            phonetic,
            meaning,
            word_family,
            collocation,
            discrimination,
            example,
            example_zh,
          }) => ({
            word: word.trim(),
            pos: pos?.trim() || undefined,
            phonetic: phonetic?.trim() || undefined,
            meaning: meaning.trim(),
            word_family: word_family?.trim() || undefined,
            collocation: collocation?.trim() || undefined,
            discrimination: discrimination?.trim() || undefined,
            example: example?.trim() || undefined,
            example_zh: example_zh?.trim() || undefined,
          }),
        );
      form.set("vocabJson", JSON.stringify(payload));
    } else {
      form.set("prompt", prompt);
      form.set("draft", "");
      form.set("revised", revised);
      form.set("notes", notes);
    }

    setLoading(true);
    setProgress(0);
    try {
      const { ok, data } = await uploadWithProgress(
        "/api/upload",
        form,
        setProgress,
      );
      if (!ok) {
        throw new Error(data.error || "保存失败");
      }
      setIsEdit(true);
      setProgress(100);
      setMessage(
        `已保存「${year} · ${SECTION_LABELS[type]}」${
          isVocab && data.count ? `（${data.count} 条生词）` : ""
        }`,
      );
      router.refresh();
      window.setTimeout(() => onDone?.(), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteSection() {
    if (
      !window.confirm(
        `确定清空「${year} · ${SECTION_LABELS[type]}」的全部内容？此操作不可恢复。`,
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/section", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, type, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "清空失败");
      setIsEdit(false);
      setVocabItems([createEmptyVocabDraft()]);
      setPrompt("");
      setRevised("");
      setNotes("");
      setDraftImageIds([]);
      setImageIds([]);
      setVideoMediaId(null);
      setMessage(`已清空「${year} · ${SECTION_LABELS[type]}」`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "清空失败");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {seedLoading ? (
        <p className="form-hint">正在加载已有内容…</p>
      ) : isEdit ? (
        <p className="form-hint form-hint--banner">
          正在编辑已有内容，保存后将写入数据库并覆盖当前版本。
        </p>
      ) : null}

      <div className="form-row--inline">
        <label className="form-row">
          <span className="form-label">年份</span>
          <select
            className="field"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="form-row">
          <span className="form-label">模块</span>
          <select
            className="field"
            value={type}
            onChange={(e) => setType(e.target.value as SectionType)}
          >
            {SECTION_ORDER.map((key) => (
              <option key={key} value={key}>
                {SECTION_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="form-row">
        <span className="form-label">上传密码（若未配置可留空；删除与清空也需此密码）</span>
        <input
          className="field"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="UPLOAD_PASSWORD"
        />
      </label>

      {isVocab ? (
        <VocabEditor items={vocabItems} onChange={setVocabItems} />
      ) : (
        <>
          <EssayEditor
            label="题目要求"
            value={prompt}
            onChange={setPrompt}
            placeholder="粘贴作文题目或写作要求"
            minHeight={120}
          />
          <ImagePickerField
            name="images"
            label="题目配图（可选）"
            hint="可上传题目插图/图表截图。"
            existingIds={imageIds}
            existingAlt="已有题目配图"
            password={password}
            onExistingCleared={() => setImageIds([])}
          />
          <ImagePickerField
            name="draftImages"
            label="我的作文（仅图片，可多张）"
            hint="请上传手写扫描或拍照图片；不支持文本录入。"
            existingIds={draftImageIds}
            existingAlt="已有我的作文"
            password={password}
            onExistingCleared={() => setDraftImageIds([])}
          />
          <EssayEditor
            label="修改后范文"
            value={revised}
            onChange={setRevised}
            placeholder="粘贴或输入修改润色后的范文"
            minHeight={200}
          />
          <VideoPickerField
            existingMediaId={videoMediaId}
            password={password}
            onExistingCleared={() => setVideoMediaId(null)}
          />
          <EssayEditor
            label="要点（可选）"
            value={notes}
            onChange={setNotes}
            placeholder="结构提示、模板要点等"
            minHeight={96}
          />
        </>
      )}

      {progress !== null && loading ? (
        <div className="upload-progress" role="progressbar" aria-valuenow={progress}>
          <div className="upload-progress__bar" style={{ width: `${progress}%` }} />
          <span className="upload-progress__label">上传中 {progress}%</span>
        </div>
      ) : null}

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading || seedLoading || deleting}
        >
          {loading ? "保存中…" : isEdit ? "保存修改" : "保存"}
        </button>
        {isEdit ? (
          <button
            type="button"
            className="btn btn--danger"
            onClick={onDeleteSection}
            disabled={loading || seedLoading || deleting}
          >
            {deleting ? "清空中…" : "清空本模块"}
          </button>
        ) : null}
        {onDone ? (
          <button type="button" className="btn btn--secondary" onClick={onDone}>
            取消
          </button>
        ) : null}
        {message ? <div className="toast">{message}</div> : null}
        {error ? (
          <div
            className="toast"
            style={{
              color: "var(--danger)",
              borderColor: "#f5c6cb",
              background: "#fce8e6",
            }}
          >
            {error}
          </div>
        ) : null}
      </div>
    </form>
  );
}
