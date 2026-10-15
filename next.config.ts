import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // 大视频 / 多图上传（Route Handler + Server Actions）
    serverActions: {
      // 视频已直传 COS；此处只需覆盖多图上传
      bodySizeLimit: "100mb",
    },
    middlewareClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
