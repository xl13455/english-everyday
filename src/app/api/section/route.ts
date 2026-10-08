import { NextResponse } from "next/server";
import { checkUploadPassword } from "@/lib/auth";
import type { SectionType } from "@/lib/constants";
import { deleteSection } from "@/lib/queries";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      year?: number;
      type?: SectionType;
      password?: string;
    };

    if (!checkUploadPassword(body.password)) {
      return NextResponse.json({ error: "上传密码不正确" }, { status: 401 });
    }

    const year = Number(body.year);
    const type = String(body.type || "") as SectionType;
    if (!Number.isInteger(year) || year < 2010 || year > 2026) {
      return NextResponse.json({ error: "年份无效" }, { status: 400 });
    }
    if (!["vocab", "small_essay", "big_essay"].includes(type)) {
      return NextResponse.json({ error: "模块无效" }, { status: 400 });
    }

    const deleted = await deleteSection(year, type);
    if (!deleted) {
      return NextResponse.json({ error: "该模块尚无内容" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/section]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败" },
      { status: 500 },
    );
  }
}
