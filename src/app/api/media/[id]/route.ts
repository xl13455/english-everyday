import { NextResponse } from "next/server";
import { checkUploadPassword } from "@/lib/auth";
import { cosPublicUrl } from "@/lib/cos";
import { deleteMediaById, getMediaById } from "@/lib/queries";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

function disposition(filename: string) {
  return `inline; filename="${encodeURIComponent(filename)}"`;
}

function parseRange(header: string | null, total: number) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match) return null;

  const startRaw = match[1];
  const endRaw = match[2];
  let start = startRaw ? Number(startRaw) : 0;
  let end = endRaw ? Number(endRaw) : total - 1;

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (startRaw === "" && endRaw !== "") {
    // bytes=-N → last N bytes
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, total - suffix);
    end = total - 1;
  }

  if (start < 0 || end < start || start >= total) return null;
  end = Math.min(end, total - 1);
  return { start, end };
}

export async function GET(request: Request, { params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "无效媒体" }, { status: 400 });
  }

  const media = await getMediaById(id);
  if (!media) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  if (media.storage_key) {
    return NextResponse.redirect(cosPublicUrl(media.storage_key), 302);
  }

  if (!media.data) {
    return NextResponse.json({ error: "未找到文件内容" }, { status: 404 });
  }

  const data = Buffer.isBuffer(media.data)
    ? media.data
    : Buffer.from(media.data as ArrayBuffer);
  const total = data.length;
  const common = {
    "Content-Type": media.mime_type || "application/octet-stream",
    "Content-Disposition": disposition(media.filename),
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const range = parseRange(request.headers.get("range"), total);
  if (range) {
    const { start, end } = range;
    const chunk = Uint8Array.from(data.subarray(start, end + 1));
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        ...common,
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${start}-${end}/${total}`,
      },
    });
  }

  if (request.headers.get("range")) {
    return new NextResponse(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${total}`,
        "Accept-Ranges": "bytes",
      },
    });
  }

  return new NextResponse(Uint8Array.from(data), {
    status: 200,
    headers: {
      ...common,
      "Content-Length": String(total),
    },
  });
}

export async function DELETE(request: Request, { params }: Props) {
  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "无效媒体" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      password?: string;
    };
    if (!checkUploadPassword(body.password)) {
      return NextResponse.json({ error: "上传密码不正确" }, { status: 401 });
    }

    const deleted = await deleteMediaById(id);
    if (!deleted) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/media DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败" },
      { status: 500 },
    );
  }
}
