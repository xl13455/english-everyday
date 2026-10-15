import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import COS from "cos-nodejs-sdk-v5";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SecretId = process.env.COS_SECRET_ID;
const SecretKey = process.env.COS_SECRET_KEY;
const Bucket = process.env.COS_BUCKET;
const Region = process.env.COS_REGION;

for (const [name, value] of Object.entries({
  COS_SECRET_ID: SecretId,
  COS_SECRET_KEY: SecretKey,
  COS_BUCKET: Bucket,
  COS_REGION: Region,
})) {
  if (!value) {
    console.error(`缺少环境变量: ${name}`);
    process.exit(1);
  }
}

const cos = new COS({ SecretId, SecretKey });
const key = `tests/cos-ping-${Date.now()}.txt`;
const body = `english-everyday cos test ${new Date().toISOString()}\n`;
const publicUrl = `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`;

function putObject() {
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket,
        Region,
        Key: key,
        Body: Buffer.from(body, "utf8"),
        ContentType: "text/plain; charset=utf-8",
        // 桶默认非公有读时，需给对象单独开 public-read
        ACL: "public-read",
      },
      (err, data) => (err ? reject(err) : resolve(data)),
    );
  });
}

function headObject() {
  return new Promise((resolve, reject) => {
    cos.headObject({ Bucket, Region, Key: key }, (err, data) =>
      err ? reject(err) : resolve(data),
    );
  });
}

function deleteObject() {
  return new Promise((resolve, reject) => {
    cos.deleteObject({ Bucket, Region, Key: key }, (err, data) =>
      err ? reject(err) : resolve(data),
    );
  });
}

async function main() {
  console.log("Bucket:", Bucket);
  console.log("Region:", Region);
  console.log("Key:", key);

  console.log("\n1) 上传测试文件...");
  const put = await putObject();
  console.log("   putObject OK, status:", put.statusCode ?? put.status);

  console.log("2) headObject 校验...");
  const head = await headObject();
  console.log("   headObject OK, size:", head.headers?.["content-length"]);

  console.log("3) 公有读 URL 拉取...");
  const res = await fetch(publicUrl);
  const text = await res.text();
  console.log("   HTTP", res.status);
  if (!res.ok) {
    throw new Error(`公有读失败: ${res.status} ${text.slice(0, 200)}`);
  }
  if (text !== body) {
    throw new Error("下载内容与上传不一致");
  }
  console.log("   内容一致");
  console.log("   URL:", publicUrl);

  console.log("4) 清理测试文件...");
  await deleteObject();
  console.log("   已删除");

  console.log("\n✅ COS 连通正常（上传 / 公有读 / 删除）");
}

main().catch((err) => {
  console.error("\n❌ COS 测试失败");
  console.error(err?.message || err);
  if (err?.error) console.error(err.error);
  process.exit(1);
});
