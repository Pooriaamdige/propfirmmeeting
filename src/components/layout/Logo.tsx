import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="پراپ‌میتینگ — صفحه اصلی">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden className="shrink-0">
        <rect x="0.5" y="0.5" width="33" height="33" rx="9" fill="var(--card)" stroke="var(--border-strong)" />
        <path d="M8 22.5 13.5 16l4 3.5L26 10" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="26" cy="10" r="2.2" fill="var(--accent)" />
        <path d="M8 26h18" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-extrabold tracking-tight">پراپ‌میتینگ</span>
        <span className="latin mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted">Prop Intelligence</span>
      </span>
    </Link>
  );
}
