"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import {
  formatBytes,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_COUNT,
  validateImageFiles,
} from "@/lib/upload-limits";

type Props = {
  name: string;
  label: string;
  hint?: string;
  existingIds?: number[];
  existingAlt?: string;
  password?: string;
  onExistingCleared?: () => void;
};

export function ImagePickerField({
  name,
  label,
  hint,
  existingIds = [],
  existingAlt = "已有图片",
  password = "",
  onExistingCleared,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const next = Array.from(e.target.files || []);
    const err = validateImageFiles(next);
    if (err) {
      setLocalError(err);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setLocalError(null);
    setFiles(next);
  }

  function clearFiles() {
    setFiles([]);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function clearExisting() {
    if (existingIds.length === 0) return;
    if (!window.confirm(`确定删除已有的 ${existingIds.length} 张图片？`)) return;
    setClearing(true);
    setLocalError(null);
    try {
      const res = await fetch("/api/media/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: existingIds, password }),
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
      {hint ? <p className="form-hint">{hint}</p> : null}
      <p className="form-hint">
        单张 ≤ {formatBytes(MAX_IMAGE_BYTES)}，最多 {MAX_IMAGE_COUNT} 张。
      </p>

      {existingIds.length > 0 && files.length === 0 ? (
        <div className="essay-panel__body--images upload-preview-images">
          {existingIds.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={id}
              className="essay-image"
              src={`/api/media/${id}`}
              alt={existingAlt}
            />
          ))}
          <p className="form-hint">以上为已保存图片；重新选择后将覆盖。</p>
        </div>
      ) : null}

      {previews.length > 0 ? (
        <div className="essay-panel__body--images upload-preview-images">
          {previews.map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              className="essay-image"
              src={url}
              alt={files[index]?.name || "预览"}
            />
          ))}
          <p className="form-hint">
            已选 {files.length} 张：{files.map((f) => f.name).join("、")}（共{" "}
            {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}）
          </p>
        </div>
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
          name={name}
          type="file"
          accept="image/*"
          multiple
          onChange={onChange}
        />
        <label htmlFor={inputId} className="btn btn--primary image-picker__btn">
          选择图片
        </label>
        {files.length > 0 ? (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={clearFiles}
          >
            清除所选
          </button>
        ) : null}
        {existingIds.length > 0 && files.length === 0 ? (
          <button
            type="button"
            className="btn btn--danger"
            onClick={clearExisting}
            disabled={clearing}
          >
            {clearing ? "删除中…" : "删除已有图片"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
