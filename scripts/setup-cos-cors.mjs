import fs from "fs";
import COS from "cos-nodejs-sdk-v5";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const cos = new COS({
  SecretId: env.COS_SECRET_ID,
  SecretKey: env.COS_SECRET_KEY,
});

await new Promise((resolve, reject) => {
  cos.putBucketCors(
    {
      Bucket: env.COS_BUCKET,
      Region: env.COS_REGION,
      CORSRules: [
        {
          AllowedOrigin: ["*"],
          AllowedMethod: ["GET", "PUT", "HEAD", "POST"],
          AllowedHeader: ["*"],
          ExposeHeader: ["ETag", "Content-Length", "x-cos-request-id"],
          MaxAgeSeconds: 600,
        },
      ],
    },
    (err, data) => (err ? reject(err) : resolve(data)),
  );
});

console.log("COS CORS OK:", env.COS_BUCKET, env.COS_REGION);
