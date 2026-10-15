"use client";

import COS from "cos-js-sdk-v5";
import { formatBytes, MAX_VIDEO_BYTES, validateVideoFile } from "./upload-limits";

type PresignInfo = {
  key: string;
  bucket: string;
  region: string;
  publicUrl: string;
  mimeType?: string;
  error?: string;
};

/** 向服务端要 object key，再用 COS SDK 分片并行直传。 */
export async function uploadVideoToCos(input: {
  file: File;
  year: number;
  type: string;
  password: string;
  onProgress?: (percent: number) => void;
}): Promise<{ key: string; publicUrl: string }> {
  const err = validateVideoFile(input.file);
  if (err) throw new Error(err);
  if (input.file.size > MAX_VIDEO_BYTES) {
    throw new Error(`视频超过 ${formatBytes(MAX_VIDEO_BYTES)}`);
  }

  const presignRes = await fetch("/api/cos/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      password: input.password,
      filename: input.file.name,
      mimeType: input.file.type || "application/octet-stream",
      size: input.file.size,
      year: input.year,
      type: input.type,
    }),
  });
  const presign = (await presignRes.json().catch(() => ({}))) as PresignInfo;
  if (!presignRes.ok) {
    throw new Error(presign.error || "申请上传地址失败");
  }
  if (!presign.key || !presign.bucket || !presign.region) {
    throw new Error("预签名响应无效");
  }

  const cos = new COS({
    Protocol: "https:",
    // 分片上传：每片约 8MB，最多 4 路并行
    ChunkParallelLimit: 4,
    getAuthorization: (_options, callback) => {
      fetch("/api/cos/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: input.password,
          method: _options.Method,
          pathname: _options.Pathname,
          query: _options.Query,
          headers: _options.Headers,
        }),
      })
        .then(async (res) => {
          const data = (await res.json().catch(() => ({}))) as {
            Authorization?: string;
            error?: string;
          };
          if (!res.ok || !data.Authorization) {
            throw new Error(data.error || "COS 签名失败");
          }
          // SDK 类型：Authorization 字符串即可
          callback(data.Authorization);
        })
        .catch((e) => {
          console.error("[cos auth]", e);
          // 触发 SDK 失败路径
          callback("" as unknown as COS.Authorization);
        });
    },
  });

  try {
    await cos.uploadFile({
      Bucket: presign.bucket,
      Region: presign.region,
      Key: presign.key,
      Body: input.file,
      ContentType: input.file.type || "application/octet-stream",
      // 超过 8MB 自动分片
      SliceSize: 8 * 1024 * 1024,
      ChunkSize: 8 * 1024 * 1024,
      Headers: {
        "x-cos-acl": "public-read",
      },
      onProgress: (progressData) => {
        const percent = Math.min(
          100,
          Math.round((progressData.percent || 0) * 100),
        );
        input.onProgress?.(percent);
      },
    });
    input.onProgress?.(100);
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "object" && e && "message" in e
          ? String((e as { message: unknown }).message)
          : "COS 分片上传失败（请确认网络与 Bucket CORS）";
    throw new Error(message);
  }

  return { key: presign.key, publicUrl: presign.publicUrl };
}
