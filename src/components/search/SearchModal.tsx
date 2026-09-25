"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { SearchKind, SearchResult } from "@/lib/services/searchService";

const OPEN_EVENT = "pfm:open-search";
export const openSearch = () => window.dispatchEvent(new Event(OPEN_EVENT));

const KIND_META: Record<SearchKind, { label: string; icon: IconName }> = {
  "prop-firm": { label: "پراپ‌فرم", icon: "shield" },
  article: { label: "مقاله", icon: "book" },
  market: { label: "بازار", icon: "chart" },
  news: { label: "خبر", icon: "calendar" },
  page: { label: "صفحه", icon: "layers" },
};

function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
}

export function SearchModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    lastFocus.current?.focus();
  }, []);

  useEffect(() => {
    const show = () => {
      lastFocus.current = document.activeElement as HTMLElement;
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show();
      } else if (e.key === "/" && !isTyping(e.target)) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        setResults(await res.json());
        setActive(0);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, open]);

  const go = (r: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Tab") e.preventDefault(); // keep focus in the dialog
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="جستجو" className="card relative w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی پراپ‌فرم، مقاله، نماد یا خبر…"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-faint"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `sr-${active}` : undefined}
          />
          <kbd className="latin rounded border border-line px-1.5 py-0.5 text-[10px] text-faint">ESC</kbd>
        </div>
        <ul id="search-results" role="listbox" className="scrollbar-thin max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && !loading && <li className="px-3 py-8 text-center text-sm text-muted">نتیجه‌ای پیدا نشد.</li>}
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.href}-${r.title}`} id={`sr-${i}`} role="option" aria-selected={i === active}>
              <button onMouseEnter={() => setActive(i)} onClick={() => go(r)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start", i === active ? "bg-surface" : "")}>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line", i === active ? "text-accent" : "text-muted")}>
                  <Icon name={KIND_META[r.kind].icon} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.title}</span>
                  <span className="block truncate text-xs text-muted">{r.subtitle}</span>
                </span>
                <span className="text-[11px] text-faint">{KIND_META[r.kind].label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-faint">
          <span><kbd className="latin">↑↓</kbd> جابه‌جایی</span>
          <span><kbd className="latin">Enter</kbd> باز کردن</span>
          <span className="ms-auto"><kbd className="latin">/</kbd> یا <kbd className="latin">Ctrl K</kbd></span>
        </div>
      </div>
    </div>
  );
}
