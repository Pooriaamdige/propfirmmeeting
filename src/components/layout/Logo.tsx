import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/cn";

/** The brand "P" with the check mark knocked out (vector recreation of the logo mark). */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size * (92 / 112)} height={size} viewBox="0 0 92 112" className={className} aria-hidden>
      <defs>
        <mask id={`${id}-m`}>
          <rect width="92" height="112" fill="#fff" />
          <path d="M14 44 L34 64 L76 22" fill="none" stroke="#000" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter" />
        </mask>
      </defs>
      <path d="M0 0 H52 A40 40 0 0 1 52 80 H32 V112 H6 A6 6 0 0 1 0 106 Z" fill="#eb7e2f" mask={`url(#${id}-m)`} />
    </svg>
  );
}

/** Full wordmark: [P]ropFirm with "MEETING" underline, as in the brand logo. Always LTR. */
export function Wordmark({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const s = { sm: { mark: 22, text: "text-[19px]", sub: "text-[7.5px]" }, md: { mark: 28, text: "text-[24px]", sub: "text-[8.5px]" }, lg: { mark: 64, text: "text-[56px]", sub: "text-[15px]" } }[size];
  return (
    <span dir="ltr" className={cn("inline-flex flex-col items-stretch leading-none", className)}>
      <span className="flex items-end">
        <LogoMark size={s.mark} />
        <span className={cn("font-brand -ms-px font-bold tracking-[0.02em] text-accent-2", s.text)} style={{ lineHeight: 0.8 }}>
          ropFirm
        </span>
      </span>
      <span className={cn("font-brand mt-1 flex items-center gap-1.5 font-medium uppercase tracking-[0.32em] text-accent-2/90", s.sub)}>
        <span className="h-px flex-1 bg-accent-2/70" />
        Meeting
        <span className="h-px flex-1 bg-accent-2/70" />
      </span>
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center rounded-md transition-opacity hover:opacity-90" aria-label="PropFirm Meeting — صفحه اصلی">
      <Wordmark />
    </Link>
  );
}
