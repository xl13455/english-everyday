"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  /** 编辑预览时可直接加载；浏览页默认点击后再拉流 */
  eager?: boolean;
  className?: string;
};

type Phase = "idle" | "loading" | "ready" | "error";

export function EssayVideo({ src, eager = false, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(eager);
  const [phase, setPhase] = useState<Phase>(eager ? "loading" : "idle");
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    setActive(eager);
    setPhase(eager ? "loading" : "idle");
    setErrorText(null);
  }, [src, eager]);

  function start() {
    setErrorText(null);
    setPhase("loading");
    setActive(true);
  }

  function onLoadedMetadata() {
    setPhase("ready");
  }

  function onCanPlay() {
    setPhase("ready");
  }

  function onWaiting() {
    setPhase((prev) => (prev === "error" ? prev : "loading"));
  }

  function onPlaying() {
    setPhase("ready");
  }

  function onError() {
    setPhase("error");
    setErrorText("视频加载失败，请检查网络后重试");
  }

  function retry() {
    const el = videoRef.current;
    setErrorText(null);
    setPhase("loading");
    setActive(true);
    if (el) {
      el.load();
    }
  }

  return (
    <div className={`essay-video-shell ${className}`.trim()}>
      {!active ? (
        <button
          type="button"
          className="essay-video-poster"
          onClick={start}
          aria-label="播放讲解视频"
        >
          <span className="essay-video-poster__icon" aria-hidden>
            ▶
          </span>
          <span className="essay-video-poster__text">点击播放</span>
          <span className="essay-video-poster__hint">大视频将按需加载，不预拉全量</span>
        </button>
      ) : (
        <>
          <video
            ref={videoRef}
            className="essay-video"
            src={src}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            onLoadedMetadata={onLoadedMetadata}
            onCanPlay={onCanPlay}
            onWaiting={onWaiting}
            onPlaying={onPlaying}
            onError={onError}
          >
            您的浏览器不支持视频播放。
          </video>

          {phase === "loading" ? (
            <div className="essay-video-overlay" aria-live="polite">
              <span className="essay-video-spinner" aria-hidden />
              <span>视频加载中…</span>
            </div>
          ) : null}

          {phase === "error" ? (
            <div className="essay-video-overlay essay-video-overlay--error">
              <p>{errorText}</p>
              <button type="button" className="btn btn--secondary" onClick={retry}>
                重试
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
