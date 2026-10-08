import { NextResponse } from "next/server";
import type { SectionType } from "@/lib/constants";
import { getSectionFormSeed, getYearContent } from "@/lib/queries";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ year: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const year = Number((await params).year);
  if (!Number.isInteger(year) || year < 2010 || year > 2026) {
    return NextResponse.json({ error: "年份无效" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as SectionType | null;
  if (type && ["vocab", "small_essay", "big_essay"].includes(type)) {
    const seed = await getSectionFormSeed(year, type);
    return NextResponse.json(seed);
  }

  const content = await getYearContent(year);
  return NextResponse.json(content);
}
