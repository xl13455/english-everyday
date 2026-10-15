"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import {
  formatBytes,
  MAX_VIDEO_BYTES,
  validateVideoFile,
} from "@/lib/upload-limits";
import { EssayVideo } from "@/components/EssayVideo";

type Props = {
  label?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  existingMediaId?: number | null;
  existingVideoUrl?: string | null;
  password?: string;
  onExistingCleared?: () => void;
};

export function VideoPickerField({
  label = "讲解视频（可选）",
  file,
  onFileChange,
  existingMediaId = null,
  existingVideoUrl = null,
  password = "",
  onExistingCleared,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] || null;
    const err = validateVideoFile(next);
    if (err) {
      setLocalError(err);
      onFileChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setLocalError(null);
    onFileChange(next);
  }

  function clearFile() {
    onFileChange(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function clearExisting() {
    if (!existingMediaId) return;
    if (!window.confirm("确定删除已有讲解视频？")) return;
    setClearing(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/media/${existingMediaId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "删除失败");
      onExistingCleared?.();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="form-row image-picker">
      <span className="form-label">{label}</span>
      <p className="form-hint">
        可稍后上传本地视频（如 mp4），浏览器直传腾讯云 COS。单文件 ≤{" "}
        {formatBytes(MAX_VIDEO_BYTES)}。
      </p>

      {existingMediaId && !file ? (
        <div className="essay-panel__body essay-panel__body--video upload-preview-images">
          <EssayVideo
            src={existingVideoUrl || `/api/media/${existingMediaId}`}
            eager
          />
          <p className="form-hint">以上为已保存视频；重新选择后将覆盖。</p>
        </div>
      ) : null}

      {file ? (
        <p className="form-hint form-hint--banner">
          已选：{file.name}（{formatBytes(file.size)}）
        </p>
      ) : null}

      {localError ? (
        <p className="form-hint" style={{ color: "var(--danger)" }}>
          {localError}
        </p>
      ) : null}

      <div className="image-picker__actions">
        <input
          ref={inputRef}
          id={inputId}
          className="image-picker__input"
          type="file"
          accept="video/*"
          onChange={onChange}
        />
        <label htmlFor={inputId} className="btn btn--primary image-picker__btn">
          选择视频
        </label>
        {file ? (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={clearFile}
          >
            清除所选
          </button>
        ) : null}
        {existingMediaId && !file ? (
          <button
            type="button"
            className="btn btn--danger"
            onClick={clearExisting}
            disabled={clearing}
          >
            {clearing ? "删除中…" : "删除已有视频"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
