"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { MarketClockCompact } from "@/components/market/MarketClock";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./nav";
import { ThemeToggle } from "./ThemeToggle";
import { openSearch } from "@/components/search/SearchModal";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return path === "/" ? pathname === "/" : pathname.startsWith(path.replace(/\/$/, ""));
  };

  return (
    <header className={cn("sticky top-0 z-40 transition-[background,border,backdrop-filter] duration-300", scrolled || open ? "border-b border-line bg-[var(--header-bg)] backdrop-blur-xl backdrop-saturate-150" : "border-b border-transparent")}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-contrast">
        پرش به محتوای اصلی
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="ناوبری اصلی" className="ms-4 hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn("relative whitespace-nowrap rounded-md px-2 py-2 text-[13.5px] transition-colors hover:text-fg xl:px-2.5", isActive(item.href) ? "text-fg" : "text-muted")}
                >
                  {item.label}
                  {isActive(item.href) && <span className="absolute inset-x-2.5 -bottom-[13px] h-0.5 rounded-full bg-accent" aria-hidden />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-1.5">
          <MarketClockCompact />
          <button
            onClick={openSearch}
            className="flex h-9 items-center gap-2 rounded-lg border border-line bg-card/60 px-2.5 text-sm text-muted transition hover:border-line-strong hover:text-fg"
            aria-label="جستجو (Ctrl+K)"
          >
            <Icon name="search" size={16} />
            <span className="hidden md:inline xl:hidden 2xl:inline">جستجو</span>
            <kbd className="latin hidden whitespace-nowrap rounded border border-line px-1.5 text-[10px] text-faint md:inline xl:hidden 2xl:inline">Ctrl K</kbd>
          </button>
          <Link href="/lottery/" className="relative hidden h-9 items-center gap-1.5 rounded-lg border border-accent-2/30 bg-accent-2/10 px-2.5 text-sm font-medium text-accent-2 transition hover:bg-accent-2/20 sm:inline-flex" aria-label="قرعه‌کشی">
            <span className="absolute -end-1 -top-1 h-2 w-2 rounded-full bg-accent live-dot" aria-hidden />
            <Icon name="gift" size={16} />
            <span className="hidden 2xl:inline">قرعه‌کشی</span>
          </Link>
          <ThemeToggle />
          <Link href="/login/" className="hidden h-9 items-center whitespace-nowrap rounded-lg bg-fg px-3.5 text-sm font-medium text-bg transition hover:opacity-90 sm:inline-flex">
            ورود / ثبت‌نام
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-lg text-fg hover:bg-card xl:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "بستن منو" : "باز کردن منو"}>
            <Icon name={open ? "x" : "menu"} size={20} />
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      <div id="mobile-nav" hidden={!open} className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-bg xl:hidden">
        <nav aria-label="ناوبری موبایل" className="px-4 py-4">
          <ul className="divide-y divide-line">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={cn("flex items-center justify-between py-3.5 text-base", isActive(item.href) ? "font-semibold text-accent" : "text-fg")}>
                  {item.label}
                  <Icon name="arrow-left" size={16} className="text-faint" />
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/lottery/" className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-accent-2/30 bg-accent-2/10 font-medium text-accent-2">
            <Icon name="gift" size={18} /> شرکت در قرعه‌کشی
          </Link>
          <Link href="/login/" className="mt-3 flex h-12 w-full items-center justify-center rounded-lg bg-accent font-medium text-accent-contrast">
            ورود / ثبت‌نام
          </Link>
        </nav>
      </div>
    </header>
  );
}
