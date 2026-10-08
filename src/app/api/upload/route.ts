import { NextResponse } from "next/server";
import { checkUploadPassword } from "@/lib/auth";
import type { SectionType } from "@/lib/constants";
import { getYearContent, saveEssay, saveVocab } from "@/lib/queries";
import type { VocabItem } from "@/lib/types";
import {
  formatBytes,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_COUNT,
  MAX_VIDEO_BYTES,
} from "@/lib/upload-limits";

export const runtime = "nodejs";
export const maxDuration = 300;

function validateCollected(
  files: { filename: string; mimeType: string; data: Buffer }[],
  kind: "image" | "video",
) {
  if (kind === "image") {
    if (files.length > MAX_IMAGE_COUNT) {
      return `图片最多 ${MAX_IMAGE_COUNT} 张`;
    }
    for (const file of files) {
      if (!file.mimeType.startsWith("image/")) {
        return `「${file.filename}」不是图片文件`;
      }
      if (file.data.length > MAX_IMAGE_BYTES) {
        return `「${file.filename}」超过 ${formatBytes(MAX_IMAGE_BYTES)}`;
      }
    }
  } else if (files[0]) {
    const file = files[0];
    if (!file.mimeType.startsWith("video/")) {
      return `「${file.filename}」不是视频文件`;
    }
    if (file.data.length > MAX_VIDEO_BYTES) {
      return `「${file.filename}」超过 ${formatBytes(MAX_VIDEO_BYTES)}`;
    }
  }
  return null;
}

async function collectFiles(form: FormData, field: string) {
  const files: { filename: string; mimeType: string; data: Buffer }[] = [];
  for (const value of form.getAll(field)) {
    if (!(value instanceof File) || value.size === 0) continue;
    files.push({
      filename: value.name,
      mimeType: value.type || "application/octet-stream",
      data: Buffer.from(await value.arrayBuffer()),
    });
  }
  return files;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    if (!checkUploadPassword(form.get("password"))) {
      return NextResponse.json({ error: "上传密码不正确" }, { status: 401 });
    }

    const year = Number(form.get("year"));
    const type = String(form.get("type") || "") as SectionType;
    if (!Number.isInteger(year) || year < 2010 || year > 2026) {
      return NextResponse.json({ error: "年份无效" }, { status: 400 });
    }
    if (!["vocab", "small_essay", "big_essay"].includes(type)) {
      return NextResponse.json({ error: "模块无效" }, { status: 400 });
    }

    if (type === "vocab") {
      const raw = String(form.get("vocabJson") || "[]");
      const parsed = JSON.parse(raw) as VocabItem[];
      const items = parsed
        .map((item) => ({
          word: String(item.word || "").trim(),
          pos: String(item.pos || "").trim() || undefined,
          phonetic: String(item.phonetic || "").trim() || undefined,
          meaning: String(item.meaning || "").trim(),
          word_family: String(item.word_family || "").trim() || undefined,
          collocation: String(item.collocation || "").trim() || undefined,
          discrimination:
            String(item.discrimination || "").trim() || undefined,
          example: String(item.example || "").trim() || undefined,
          example_zh: String(item.example_zh || "").trim() || undefined,
        }))
        .filter((item) => item.word && item.meaning);
      if (items.length === 0) {
        return NextResponse.json(
          { error: "请至少填写一条完整生词" },
          { status: 400 },
        );
      }
      await saveVocab(year, items);
      return NextResponse.json({ ok: true, count: items.length });
    }

    const prompt = String(form.get("prompt") || "").trim();
    const revised = String(form.get("revised") || "").trim();
    const notes = String(form.get("notes") || "").trim();
    const clearImages = form.get("clearImages") === "1";
    const clearDraftImages = form.get("clearDraftImages") === "1";
    const clearVideo = form.get("clearVideo") === "1";

    const images = await collectFiles(form, "images");
    const draftImages = await collectFiles(form, "draftImages");

    let videoFile: { filename: string; mimeType: string; data: Buffer } | null =
      null;
    const video = form.get("videoFile");
    if (video instanceof File && video.size > 0) {
      videoFile = {
        filename: video.name,
        mimeType: video.type || "application/octet-stream",
        data: Buffer.from(await video.arrayBuffer()),
      };
    }

    const imageErr = validateCollected(images, "image");
    if (imageErr) {
      return NextResponse.json({ error: imageErr }, { status: 400 });
    }
    const draftErr = validateCollected(draftImages, "image");
    if (draftErr) {
      return NextResponse.json({ error: draftErr }, { status: 400 });
    }
    if (videoFile) {
      const videoErr = validateCollected([videoFile], "video");
      if (videoErr) {
        return NextResponse.json({ error: videoErr }, { status: 400 });
      }
    }

    if (!prompt || !revised) {
      return NextResponse.json(
        { error: "题目与修改后范文必填" },
        { status: 400 },
      );
    }

    const existing = await getYearContent(year);
    const currentEssay =
      type === "small_essay" ? existing.small_essay : existing.big_essay;

    const hasNewDraftImages = draftImages.length > 0;
    const hasOldDraftImages =
      Boolean(currentEssay?.draftImageIds?.length) && !clearDraftImages;
    if (!hasNewDraftImages && !hasOldDraftImages) {
      return NextResponse.json(
        { error: "我的作文必须上传图片" },
        { status: 400 },
      );
    }

    const hasNewVideo = Boolean(videoFile);
    const hasOldVideo = Boolean(currentEssay?.videoMediaId) && !clearVideo;
    if (!hasNewVideo && !hasOldVideo) {
      return NextResponse.json(
        { error: "讲解视频必须上传文件" },
        { status: 400 },
      );
    }

    await saveEssay({
      year,
      type,
      prompt,
      draft: "",
      revised,
      notes,
      images,
      draftImages,
      videoFile,
      replaceImages: images.length > 0,
      replaceDraftImages: draftImages.length > 0,
      replaceVideoFile: Boolean(videoFile),
      clearImages,
      clearDraftImages,
      clearVideo,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/upload]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存失败" },
      { status: 500 },
    );
  }
}
