import { NextResponse } from "next/server";
import { checkUploadPassword } from "@/lib/auth";
import {
  buildVideoObjectKey,
  cosConfigured,
  cosPublicUrl,
  getCosConfig,
} from "@/lib/cos";
import {
  formatBytes,
  MAX_VIDEO_BYTES,
} from "@/lib/upload-limits";

export const runtime = "nodejs";

/** 为浏览器分片直传准备 object key（实际签名走 /api/cos/auth）。 */
export async function POST(request: Request) {
  try {
    if (!cosConfigured()) {
      return NextResponse.json(
        { error: "未配置腾讯云 COS" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as {
      password?: string;
      filename?: string;
      mimeType?: string;
      size?: number;
      year?: number;
      type?: string;
    };

    if (!checkUploadPassword(body.password)) {
      return NextResponse.json({ error: "上传密码不正确" }, { status: 401 });
    }

    const year = Number(body.year);
    const type = String(body.type || "");
    const filename = String(body.filename || "").trim();
    const mimeType = String(body.mimeType || "application/octet-stream");
    const size = Number(body.size);

    if (!Number.isInteger(year) || year < 2010 || year > 2026) {
      return NextResponse.json({ error: "年份无效" }, { status: 400 });
    }
    if (!["small_essay", "big_essay"].includes(type)) {
      return NextResponse.json({ error: "模块无效" }, { status: 400 });
    }
    if (!filename) {
      return NextResponse.json({ error: "缺少文件名" }, { status: 400 });
    }
    if (!mimeType.startsWith("video/")) {
      return NextResponse.json({ error: "仅支持视频文件" }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: "文件大小无效" }, { status: 400 });
    }
    if (size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: `视频超过 ${formatBytes(MAX_VIDEO_BYTES)}` },
        { status: 400 },
      );
    }

    const key = buildVideoObjectKey({ year, type, filename });
    const { Bucket, Region } = getCosConfig();

    return NextResponse.json({
      key,
      bucket: Bucket,
      region: Region,
      publicUrl: cosPublicUrl(key),
      mimeType,
    });
  } catch (error) {
    console.error("[api/cos/presign]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "预签名失败" },
      { status: 500 },
    );
  }
}
