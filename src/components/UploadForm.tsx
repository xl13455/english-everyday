"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
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

const PASSWORD_STORAGE_KEY = "ee-upload-password";

type Props = {
  defaultYear?: number;
  defaultType?: SectionType;
  passwordRequired?: boolean;
  onDone?: () => void;
};

export function UploadForm({
  defaultYear = 2024,
  defaultType = "vocab",
  passwordRequired = false,
  onDone,
}: Props) {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PASSWORD_STORAGE_KEY);
      if (saved) setPassword(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function showFeedback(kind: "error" | "message", text: string) {
    if (kind === "error") {
      setError(text);
      setMessage(null);
    } else {
      setMessage(text);
      setError(null);
    }
    window.requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function focusPassword() {
    passwordRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    passwordRef.current?.focus();
  }

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
        setVideoUrl(seed.essay?.videoUrl ?? null);
        setVideoFile(null);
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

    if (passwordRequired && !password.trim()) {
      showFeedback("error", "请先填写上传密码后再保存");
      focusPassword();
      return;
    }

    if (isVocab) {
      const valid = vocabItems.filter(
        (item) => item.word.trim() && item.meaning.trim(),
      );
      if (valid.length === 0) {
        showFeedback("error", "请至少填写一条完整生词（单词 + 释义）。");
        return;
      }
    }

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    form.set("year", String(year));
    form.set("type", type);
    form.set("password", password);

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
      if (!isVocab && videoFile) {
        // 动态加载 COS SDK，避免一打开弹窗就拉大包导致偶发白屏
        const { uploadVideoToCos } = await import("@/lib/upload-video-to-cos");
        const uploaded = await uploadVideoToCos({
          file: videoFile,
          year,
          type,
          password,
          onProgress: (percent) => {
            // 直传 COS 占前 90%，元数据保存占后 10%
            setProgress(Math.min(90, Math.round(percent * 0.9)));
          },
        });
        form.set("videoStorageKey", uploaded.key);
        form.set("videoFilename", videoFile.name);
        form.set(
          "videoMimeType",
          videoFile.type || "application/octet-stream",
        );
      }

      const { ok, status, data } = await uploadWithProgress(
        "/api/upload",
        form,
        (percent) => {
          if (videoFile) {
            setProgress(90 + Math.min(10, Math.round(percent * 0.1)));
          } else {
            setProgress(percent);
          }
        },
      );
      if (!ok) {
        if (status === 401) {
          showFeedback("error", data.error || "上传密码不正确");
          focusPassword();
          return;
        }
        throw new Error(data.error || "保存失败");
      }
      try {
        sessionStorage.setItem(PASSWORD_STORAGE_KEY, password);
      } catch {
        /* ignore */
      }
      setIsEdit(true);
      setVideoFile(null);
      setProgress(100);
      if (!isVocab) {
        try {
          const seedRes = await fetch(`/api/content/${year}?type=${type}`);
          if (seedRes.ok) {
            const seed = await seedRes.json();
            setVideoMediaId(seed.essay?.videoMediaId ?? null);
            setVideoUrl(seed.essay?.videoUrl ?? null);
            setImageIds(seed.essay?.imageIds ?? []);
            setDraftImageIds(seed.essay?.draftImageIds ?? []);
          }
        } catch {
          /* ignore refresh errors */
        }
      }
      showFeedback(
        "message",
        `已保存「${year} · ${SECTION_LABELS[type]}」${
          isVocab && data.count ? `（${data.count} 条生词）` : ""
        }`,
      );
      router.refresh();
      window.setTimeout(() => onDone?.(), 700);
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "保存失败",
      );
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
      setVideoUrl(null);
      setVideoFile(null);
      setMessage(`已清空「${year} · ${SECTION_LABELS[type]}」`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "清空失败");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form className="form form--split" onSubmit={onSubmit}>
      <div className="form__scroll">
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
          <span className="form-label">
            {passwordRequired
              ? "上传密码（必填，与 .env.local 中 UPLOAD_PASSWORD 一致）"
              : "上传密码（未配置服务端密码时可留空）"}
          </span>
          <input
            ref={passwordRef}
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={passwordRequired ? "请输入上传密码" : "UPLOAD_PASSWORD"}
            required={passwordRequired}
          />
        </label>

        {isVocab ? (
          <VocabEditor items={vocabItems} onChange={setVocabItems} />
        ) : (
          <>
            <p className="form-hint form-hint--banner">
              各部分均可单独保存：只填题目、只传图片或只传视频都可以。
            </p>
            <EssayEditor
              label="题目要求（可选）"
              value={prompt}
              onChange={setPrompt}
              placeholder="粘贴作文题目或写作要求"
              minHeight={88}
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
              label="我的作文（可选，仅图片，可多张）"
              hint="可稍后上传手写扫描或拍照；不支持文本录入。"
              existingIds={draftImageIds}
              existingAlt="已有我的作文"
              password={password}
              onExistingCleared={() => setDraftImageIds([])}
            />
            <EssayEditor
              label="修改后范文（可选）"
              value={revised}
              onChange={setRevised}
              placeholder="粘贴或输入修改润色后的范文"
              minHeight={140}
            />
            <VideoPickerField
              label="讲解视频（可选）"
              file={videoFile}
              onFileChange={setVideoFile}
              existingMediaId={videoMediaId}
              existingVideoUrl={videoUrl}
              password={password}
              onExistingCleared={() => {
                setVideoMediaId(null);
                setVideoUrl(null);
              }}
            />
            <EssayEditor
              label="要点（可选）"
              value={notes}
              onChange={setNotes}
              placeholder="结构提示、模板要点等"
              minHeight={72}
            />
          </>
        )}
      </div>

      <div className="form__footer" ref={feedbackRef}>
        {progress !== null && loading ? (
          <div
            className="upload-progress"
            role="progressbar"
            aria-valuenow={progress}
          >
            <div
              className="upload-progress__bar"
              style={{ width: `${progress}%` }}
            />
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
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onDone}
            >
              取消
            </button>
          ) : null}
        </div>
        {message ? <div className="toast toast--full">{message}</div> : null}
        {error ? (
          <div className="toast toast--full toast--error" role="alert">
            {error}
          </div>
        ) : null}
      </div>
    </form>
  );
}
