"use client";

import { MAX_COMPARE, useCompare } from "@/components/Providers";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function CompareButton({ slug, name, className, size = "sm" }: { slug: string; name: string; className?: string; size?: "sm" | "md" }) {
  const { has, toggle, selected } = useCompare();
  const active = has(slug);
  const full = !active && selected.length >= MAX_COMPARE;
  return (
    <button
      onClick={() => toggle(slug)}
      disabled={full}
      aria-pressed={active}
      title={full ? `حداکثر ${MAX_COMPARE} پراپ‌فرم قابل مقایسه است` : undefined}
      aria-label={active ? `حذف ${name} از مقایسه` : `افزودن ${name} به مقایسه`}
      className={cn(buttonClass(active ? "primary" : "secondary", size), className)}
    >
      <Icon name={active ? "check" : "plus"} size={15} />
      {active ? "در لیست مقایسه" : "مقایسه"}
    </button>
  );
}
