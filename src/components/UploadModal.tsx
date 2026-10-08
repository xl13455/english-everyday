"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { SECTION_LABELS, type SectionType } from "@/lib/constants";
import { UploadForm } from "@/components/UploadForm";

type Props = {
  defaultYear: number;
  defaultType: SectionType;
  onClose: () => void;
};

export function UploadModal({ defaultYear, defaultType, onClose }: Props) {
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);

    fetch(`/api/content/${defaultYear}?type=${defaultType}`)
      .then((res) => res.json())
      .then((data) => setIsEdit(Boolean(data.isEdit)))
      .catch(() => setIsEdit(false));

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [defaultYear, defaultType, onClose]);

  return (
    <motion.div
      className="modal-root"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        className="modal-backdrop"
        aria-label="关闭"
        onClick={onClose}
      />
      <motion.div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <div className="modal-header">
          <div>
            <h2 id="upload-modal-title" className="modal-title">
              {isEdit ? "编辑内容" : "上传内容"}
            </h2>
            <p className="modal-subtitle">
              {defaultYear} · {SECTION_LABELS[defaultType]}
              {isEdit ? " · 已有内容可直接改" : ""}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <UploadForm
            key={`${defaultYear}-${defaultType}`}
            defaultYear={defaultYear}
            defaultType={defaultType}
            onDone={onClose}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
