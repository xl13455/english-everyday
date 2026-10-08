/** 校验上传/删除操作的密码；未配置 UPLOAD_PASSWORD 时放行。 */
export function checkUploadPassword(password: unknown): boolean {
  const expected = process.env.UPLOAD_PASSWORD;
  if (!expected) return true;
  return String(password || "") === expected;
}

export function uploadPasswordConfigured(): boolean {
  return Boolean(process.env.UPLOAD_PASSWORD);
}
