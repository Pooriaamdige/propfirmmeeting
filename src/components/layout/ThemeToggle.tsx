"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === "light" ? "light" : "dark"),
    () => null,
  );
  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("pfm:theme", next);
    } catch {}
  };
  return (
    <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-card hover:text-fg" aria-label={theme === "light" ? "تغییر به حالت تیره" : "تغییر به حالت روشن"}>
      <Icon name={theme === "light" ? "moon" : "sun"} />
    </button>
  );
}

/** Inline, render-blocking script that applies the saved theme before paint. */
export const themeScript = `try{var t=localStorage.getItem('pfm:theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;
