import { NextResponse } from "next/server";
import { checkUploadPassword } from "@/lib/auth";
import { deleteMediaByIds } from "@/lib/queries";

export const runtime = "nodejs";

/** 批量删除媒体（题目配图 / 我的作文图 / 视频）。 */
export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      ids?: number[];
      password?: string;
    };

    if (!checkUploadPassword(body.password)) {
      return NextResponse.json({ error: "上传密码不正确" }, { status: 401 });
    }

    const ids = (body.ids || [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (ids.length === 0) {
      return NextResponse.json({ error: "未指定媒体" }, { status: 400 });
    }

    const deleted = await deleteMediaByIds(ids);
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    console.error("[api/media/bulk]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败" },
      { status: 500 },
    );
  }
}
