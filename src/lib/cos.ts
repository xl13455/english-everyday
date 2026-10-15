import COS from "cos-nodejs-sdk-v5";

export type CosConfig = {
  SecretId: string;
  SecretKey: string;
  Bucket: string;
  Region: string;
  publicBaseUrl?: string;
};

export function cosConfigured(): boolean {
  return Boolean(
    process.env.COS_SECRET_ID &&
      process.env.COS_SECRET_KEY &&
      process.env.COS_BUCKET &&
      process.env.COS_REGION,
  );
}

export function getCosConfig(): CosConfig {
  const SecretId = process.env.COS_SECRET_ID;
  const SecretKey = process.env.COS_SECRET_KEY;
  const Bucket = process.env.COS_BUCKET;
  const Region = process.env.COS_REGION;
  if (!SecretId || !SecretKey || !Bucket || !Region) {
    throw new Error("腾讯云 COS 未配置（需要 COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION）");
  }
  return {
    SecretId,
    SecretKey,
    Bucket,
    Region,
    publicBaseUrl: process.env.COS_PUBLIC_BASE_URL?.replace(/\/$/, "") || undefined,
  };
}

function client() {
  const { SecretId, SecretKey } = getCosConfig();
  return new COS({ SecretId, SecretKey });
}

export function cosPublicUrl(key: string) {
  const { Bucket, Region, publicBaseUrl } = getCosConfig();
  const encoded = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  if (publicBaseUrl) return `${publicBaseUrl}/${encoded}`;
  return `https://${Bucket}.cos.${Region}.myqcloud.com/${encoded}`;
}

export function buildVideoObjectKey(input: {
  year: number;
  type: string;
  filename: string;
}) {
  const base = input.filename.replace(/[^\w.\-()\u4e00-\u9fff]+/g, "_").slice(0, 80);
  const safe = base || "video.mp4";
  return `videos/${input.year}/${input.type}/${Date.now()}-${safe}`;
}

export function putCosObject(input: {
  key: string;
  body: Buffer;
  contentType: string;
  publicRead?: boolean;
}): Promise<void> {
  const { Bucket, Region } = getCosConfig();
  const cos = client();
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket,
        Region,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType || "application/octet-stream",
        ACL: input.publicRead === false ? undefined : "public-read",
      },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

/** 浏览器直传用的预签名 PUT（须带相同 Headers）。 */
export function getPresignedPut(input: {
  key: string;
  contentType: string;
  expiresSec?: number;
}): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
  const { Bucket, Region } = getCosConfig();
  const cos = client();
  const contentType = input.contentType || "application/octet-stream";
  const headers = {
    "Content-Type": contentType,
    "x-cos-acl": "public-read",
  };
  return new Promise((resolve, reject) => {
    cos.getObjectUrl(
      {
        Bucket,
        Region,
        Key: input.key,
        Method: "PUT",
        Sign: true,
        Expires: input.expiresSec ?? 7200,
        Headers: headers,
      },
      (err, data) => {
        if (err || !data?.Url) {
          reject(err || new Error("生成 COS 预签名失败"));
          return;
        }
        resolve({ uploadUrl: data.Url, headers });
      },
    );
  });
}

/** 给浏览器 COS SDK（分片上传）签名。 */
export function getBrowserAuthorization(input: {
  method: string;
  pathname: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  expiresSec?: number;
}) {
  const { SecretId, SecretKey } = getCosConfig();
  const method = input.method.toUpperCase() as
    | "GET"
    | "DELETE"
    | "POST"
    | "PUT"
    | "OPTIONS";
  return COS.getAuthorization({
    SecretId,
    SecretKey,
    Method: method,
    Pathname: input.pathname,
    Query: input.query || {},
    Headers: input.headers || {},
    Expires: input.expiresSec ?? 7200,
  });
}

export function deleteCosObject(key: string): Promise<void> {
  if (!key) return Promise.resolve();
  const { Bucket, Region } = getCosConfig();
  const cos = client();
  return new Promise((resolve, reject) => {
    cos.deleteObject({ Bucket, Region, Key: key }, (err) =>
      err ? reject(err) : resolve(),
    );
  });
}

export async function deleteCosObjects(keys: Array<string | null | undefined>) {
  const unique = [...new Set(keys.filter((k): k is string => Boolean(k)))];
  await Promise.all(unique.map((key) => deleteCosObject(key)));
}
