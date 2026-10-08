import Link from "next/link";
import { YEAR_END } from "@/lib/constants";
import { listYearSummaries } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const summaries = await listYearSummaries();
  const picks = summaries.filter((y) => y.filled > 0).slice(0, 6);

  return (
    <>
      <div className="home-hero">
        <h1 className="page-title">考研英语真题</h1>
        <p className="page-desc">
          从左侧选择年份，查看生词、小作文与大作文。蓝点表示该模块已有内容。
        </p>
        <div className="home-hero__cta">
          <Link href={`/years/${YEAR_END}`} className="btn btn--primary">
            打开 {YEAR_END} 年
          </Link>
          {picks[0] ? (
            <Link href={`/years/${picks[0].year}`} className="btn btn--secondary">
              继续 {picks[0].year}
            </Link>
          ) : null}
        </div>
      </div>

      {picks.length > 0 ? (
        <section className="home-picks" aria-label="已有内容的年份">
          <div className="home-picks__title">已有内容 · 快速进入</div>
          <div className="home-picks__grid">
            {picks.map(({ year, filled, total }) => (
              <Link key={year} href={`/years/${year}`} className="home-pick">
                <span className="home-pick__year">{year}</span>
                <span className="home-pick__meta">
                  {filled}/{total}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
