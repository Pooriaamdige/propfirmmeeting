"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";

export function SubmitButton({ children, variant = "primary", className, pendingLabel = "در حال ذخیره…" }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, "md", className)}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Small form that posts to a server action after a confirm() prompt. */
export function ConfirmButton({ action, id, message, children, className }: { action: (fd: FormData) => void | Promise<void>; id: number | string; message: string; children: ReactNode; className?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neg transition hover:bg-neg/10", className)}>
        {children}
      </button>
    </form>
  );
}

const NAV: { href: string; label: string; icon: IconName; adminOnly?: boolean }[] = [
  { href: "/admin/", label: "داشبورد", icon: "layers" },
  { href: "/admin/prop-firms/", label: "پراپ‌فرم‌ها", icon: "shield" },
  { href: "/admin/coupons/", label: "کدهای تخفیف", icon: "gift" },
  { href: "/admin/articles/", label: "مقالات", icon: "book" },
  { href: "/admin/lottery/", label: "قرعه‌کشی", icon: "sparkle" },
  { href: "/admin/newsletter/", label: "خبرنامه", icon: "mail" },
  { href: "/admin/settings/", label: "تنظیمات سایت", icon: "filter", adminOnly: true },
  { href: "/admin/users/", label: "مدیران", icon: "user", adminOnly: true },
];

export function AdminNav({ role, onNavigate }: { role: "admin" | "editor"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="منوی مدیریت" className="space-y-1">
      {NAV.filter((n) => !n.adminOnly || role === "admin").map((n) => {
        const active = n.href === "/admin/" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(n.href.replace(/\/$/, ""));
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn("relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition", active ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-surface hover:text-fg")}
          >
            {active && <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-accent" aria-hidden />}
            <Icon name={n.icon} size={17} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
