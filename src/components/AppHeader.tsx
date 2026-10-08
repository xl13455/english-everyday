"use client";

import Link from "next/link";
import { useUpload } from "@/components/UploadProvider";

export function AppHeader() {
  const { openUpload } = useUpload();

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link href="/" className="app-header__brand">
          <span className="app-header__mark">英</span>
          <span>考研英语真题</span>
        </Link>
        <div className="app-header__spacer" />
        <nav className="app-header__nav">
          <Link href="/" className="app-header__link">
            真题
          </Link>
          <button
            type="button"
            className="app-header__link app-header__link--btn"
            onClick={() => openUpload()}
          >
            上传
          </button>
        </nav>
      </div>
    </header>
  );
}
