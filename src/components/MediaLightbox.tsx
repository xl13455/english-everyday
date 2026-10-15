"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  src: string;
  alt?: string;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const STEP = 0.25;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function MediaLightbox({ src, alt = "预览", onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const zoomBy = useCallback((delta: number) => {
    setScale((prev) =>
      clamp(Number((prev + delta).toFixed(2)), MIN_SCALE, MAX_SCALE),
    );
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (scale <= MIN_SCALE) setOffset({ x: 0, y: 0 });
  }, [scale]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomBy(STEP);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomBy(-STEP);
      } else if (e.key === "0") {
        e.preventDefault();
        resetView();
      }
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? STEP : -STEP);
    }
    const root = rootRef.current;
    window.addEventListener("keydown", onKey);
    root?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      root?.removeEventListener("wheel", onWheel);
    };
  }, [onClose, resetView, zoomBy]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (scale <= MIN_SCALE) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setOffset({
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    });
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  }

  function onDoubleClick() {
    if (scale > MIN_SCALE) resetView();
    else setScale(2);
  }

  if (typeof document === "undefined") return null;

  const percent = Math.round(scale * 100);

  return createPortal(
    <div className="media-lightbox" role="presentation" ref={rootRef}>
      <button
        type="button"
        className="media-lightbox__backdrop"
        aria-label="关闭预览"
        onClick={onClose}
      />
      <div className="media-lightbox__panel" role="dialog" aria-modal="true">
        <div className="media-lightbox__toolbar">
          <button
            type="button"
            className="media-lightbox__tool"
            onClick={() => zoomBy(-STEP)}
            disabled={scale <= MIN_SCALE}
            aria-label="缩小"
            title="缩小（-）"
          >
            −
          </button>
          <button
            type="button"
            className="media-lightbox__tool media-lightbox__tool--label"
            onClick={resetView}
            title="重置（0）"
          >
            {percent}%
          </button>
          <button
            type="button"
            className="media-lightbox__tool"
            onClick={() => zoomBy(STEP)}
            disabled={scale >= MAX_SCALE}
            aria-label="放大"
            title="放大（+）"
          >
            +
          </button>
          <button
            type="button"
            className="media-lightbox__tool"
            onClick={onClose}
            aria-label="关闭"
            title="关闭（Esc）"
          >
            ✕
          </button>
        </div>
        <div
          className={`media-lightbox__stage${scale > 1 ? " media-lightbox__stage--pan" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="media-lightbox__img"
            src={src}
            alt={alt}
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
          />
        </div>
        <p className="media-lightbox__hint">
          滚轮缩放 · 双击切换 · 放大后可拖动 · Esc 关闭
        </p>
      </div>
    </div>,
    document.body,
  );
}
