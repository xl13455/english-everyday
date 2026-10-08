/** 客户端与服务端共用的上传限制 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024; // 80MB
export const MAX_IMAGE_COUNT = 9;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImageFiles(files: File[]) {
  if (files.length > MAX_IMAGE_COUNT) {
    return `图片最多 ${MAX_IMAGE_COUNT} 张`;
  }
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return `「${file.name}」不是图片文件`;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `「${file.name}」超过 ${formatBytes(MAX_IMAGE_BYTES)}`;
    }
  }
  return null;
}

export function validateVideoFile(file: File | null) {
  if (!file) return null;
  if (!file.type.startsWith("video/")) {
    return `「${file.name}」不是视频文件`;
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return `「${file.name}」超过 ${formatBytes(MAX_VIDEO_BYTES)}`;
  }
  return null;
}
