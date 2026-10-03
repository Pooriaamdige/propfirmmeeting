import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background,color,border,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none";
const variants: Record<Variant, string> = {
  primary: "btn-sheen bg-linear-to-l from-accent to-[color-mix(in_srgb,var(--accent)_70%,var(--accent-2))] text-accent-contrast shadow-[0_8px_24px_-10px_var(--accent)] hover:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent)] hover:brightness-110",
  secondary: "border border-line-strong bg-card text-fg hover:border-accent/50 hover:bg-card-hover",
  ghost: "text-muted hover:text-fg hover:bg-card",
};
const sizes: Record<Size, string> = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({ href, variant, size, className, children, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
