import { NextResponse } from "next/server";
import { checkUploadPassword } from "@/lib/auth";
import {
  cosConfigured,
  getBrowserAuthorization,
  getCosConfig,
} from "@/lib/cos";

export const runtime = "nodejs";

/** 浏览器 cos-js-sdk 分片上传的临时签名。 */
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
      method?: string;
      pathname?: string;
      query?: Record<string, string>;
      headers?: Record<string, string>;
    };

    if (!checkUploadPassword(body.password)) {
      return NextResponse.json({ error: "上传密码不正确" }, { status: 401 });
    }

    const method = String(body.method || "GET").toUpperCase();
    const pathname = String(body.pathname || "/");
    if (!pathname.startsWith("/")) {
      return NextResponse.json({ error: "pathname 无效" }, { status: 400 });
    }

    const authorization = getBrowserAuthorization({
      method,
      pathname,
      query: body.query || {},
      headers: body.headers || {},
    });
    const { Bucket, Region } = getCosConfig();

    return NextResponse.json({
      Authorization: authorization,
      bucket: Bucket,
      region: Region,
    });
  } catch (error) {
    console.error("[api/cos/auth]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "签名失败" },
      { status: 500 },
    );
  }
}
