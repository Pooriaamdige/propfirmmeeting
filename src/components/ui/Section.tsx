import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

export function Section({ id, children, className, labelledBy }: { id?: string; children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative py-16 md:py-24", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeader({ id, eyebrow, title, subtitle, action }: { id?: string; eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <Reveal className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="latin mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-accent">
            <span className="h-px w-6 bg-accent/60" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="text-2xl font-bold leading-tight tracking-tight text-fg md:text-[2rem]">
          {title}
        </h2>
        {subtitle && <p className="mt-3 text-[15px] leading-7 text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}

export function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-line">
      <div className="grid-bg fade-mask-b pointer-events-none absolute inset-0" aria-hidden />
      <div className="ambient pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16 lg:px-8">
        <p className="latin mb-3 text-xs font-medium uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base leading-8 text-muted">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}
