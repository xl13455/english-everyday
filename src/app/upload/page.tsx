import { redirect } from "next/navigation";
import { YEAR_END } from "@/lib/constants";

type Props = {
  searchParams: Promise<{ year?: string; type?: string }>;
};

/** 上传改为本页浮层；旧链接跳到对应年份页。 */
export default async function UploadPage({ searchParams }: Props) {
  const sp = await searchParams;
  const year = Number(sp.year);
  const target =
    Number.isInteger(year) && year >= 2010 && year <= YEAR_END
      ? year
      : YEAR_END;
  redirect(`/years/${target}`);
}
