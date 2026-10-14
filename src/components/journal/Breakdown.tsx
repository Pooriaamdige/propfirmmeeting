import { cn } from "@/lib/cn";
import type { Bucket } from "@/lib/journal/analytics";
import { fmtMoney, fmtNum } from "@/lib/journal/format";

/** Table with an inline magnitude bar for net P/L (sign by color and side of the bar). */
export function BreakdownTable({ rows, currency, label, labelOf, showPips = false, empty = "داده‌ای نیست" }: { rows: Bucket[]; currency: string; label: string; labelOf?: (k: string) => string; showPips?: boolean; empty?: string }) {
  const data = rows.filter((r) => r.trades > 0);
  if (data.length === 0) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  const maxAbs = Math.max(1, ...data.map((r) => Math.abs(r.net)));
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] text-faint">
            <th className="py-2 text-start font-medium">{label}</th>
            <th className="py-2 text-start font-medium">معامله</th>
            <th className="py-2 text-start font-medium">برد</th>
            {showPips && <th className="py-2 text-start font-medium">پیپ</th>}
            <th className="w-[38%] py-2 text-start font-medium">سود/زیان خالص</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data.map((r) => (
            <tr key={r.key}>
              <td className="py-2 pe-2 font-medium">{labelOf ? labelOf(r.key) : <span dir="auto">{r.key}</span>}</td>
              <td className="num py-2 text-muted">{r.trades}</td>
              <td className="num py-2 text-muted">{fmtNum(r.winRate, 1)}%</td>
              {showPips && <td className="num py-2 text-muted">{fmtNum(r.pips, 1)}</td>}
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className={cn("num w-24 shrink-0 font-semibold", r.net >= 0 ? "text-pos" : "text-neg")}>{fmtMoney(r.net, currency, true)}</span>
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface" aria-hidden>
                    <span className={cn("absolute inset-y-0 start-0 rounded-full", r.net >= 0 ? "bg-pos" : "bg-neg")} style={{ width: `${(Math.abs(r.net) / maxAbs) * 100}%` }} />
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
