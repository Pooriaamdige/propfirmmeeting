import Link from "next/link";
import type { PropFirm } from "@/lib/types";
import { Marquee } from "@/components/fx/Motion";
import { FirmLogo } from "@/components/propfirms/shared";

export function FirmMarquee({ firms }: { firms: PropFirm[] }) {
  if (firms.length === 0) return null;
  const list = firms.length < 6 ? [...firms, ...firms] : firms;
  return (
    <Marquee duration={36}>
      {list.map((f, i) => (
        <Link key={`${f.slug}-${i}`} href={`/prop-firms/${f.slug}/`} className="flex items-center gap-3 rounded-xl border border-line bg-card/60 px-4 py-2.5 backdrop-blur transition hover:border-accent/40">
          <FirmLogo firm={f} size={30} />
          <span className="latin whitespace-nowrap text-sm font-semibold">{f.name}</span>
          <span className="font-brand text-xs text-accent-2">Split {f.profitSplit.max}%</span>
        </Link>
      ))}
    </Marquee>
  );
}
