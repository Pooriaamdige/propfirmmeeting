import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function AnnouncementBar({ text, href }: { text: string; href?: string }) {
  const inner = (
    <span className="inline-flex items-center gap-2">
      <Icon name="sparkle" size={14} className="text-accent-2" />
      {text}
      {href && <Icon name="arrow-left" size={14} />}
    </span>
  );
  return (
    <div className="relative z-50 overflow-hidden border-b border-accent/20 bg-linear-to-l from-accent/15 via-accent-2/10 to-accent/15 text-center text-[13px] font-medium">
      <div className="mx-auto max-w-7xl px-4 py-2">{href ? <Link href={href} className="hover:text-accent-2">{inner}</Link> : inner}</div>
    </div>
  );
}
