"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare } from "@/components/Providers";
import { Icon } from "@/components/ui/Icon";

/** Floating tray listing firms queued for comparison (hidden on the compare page itself). */
export function CompareTray() {
  const { selected, clear, ready } = useCompare();
  const pathname = usePathname();
  if (!ready || selected.length === 0 || pathname.startsWith("/compare")) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-line-strong bg-[var(--header-bg)] p-2 ps-4 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:start-6" role="region" aria-label="لیست مقایسه">
      <Icon name="scale" size={18} className="text-accent" />
      <p className="flex-1 text-sm">
        <span className="num font-bold">{selected.length}</span> پراپ‌فرم برای مقایسه
      </p>
      <button onClick={clear} className="rounded-md px-2 py-1.5 text-xs text-muted hover:text-fg">
        پاک کردن
      </button>
      <Link href={`/compare/?firms=${selected.join(",")}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-contrast">
        مقایسه
        <Icon name="arrow-left" size={15} />
      </Link>
    </div>
  );
}
