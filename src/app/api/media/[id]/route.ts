import { NextResponse } from "next/server";
import { checkUploadPassword } from "@/lib/auth";
import { deleteMediaById, getMediaById } from "@/lib/queries";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "无效媒体" }, { status: 400 });
  }

  const media = await getMediaById(id);
  if (!media) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mime_type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(media.filename)}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
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
