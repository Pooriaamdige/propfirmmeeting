"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/components/layout/Logo";
import { AdminNav } from "./client";

export function AdminMobileNav({ role }: { role: "admin" | "editor" }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const modal = dialog.current;
    if (open) modal?.showModal();
    else modal?.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // A modal in the browser's top layer escapes the sticky header's backdrop filter.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previous;
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-card" aria-label="منو" aria-expanded={open} aria-controls="admin-mobile-menu" aria-haspopup="dialog">
        <Icon name="menu" size={20} />
      </button>
      <dialog
        ref={dialog}
        id="admin-mobile-menu"
        aria-label="منوی مدیریت"
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const controls = e.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)");
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-fg backdrop:bg-black/65"
      >
        <div className="me-auto flex h-full w-80 max-w-[calc(100%-3rem)] flex-col overflow-y-auto overscroll-contain border-e border-line bg-bg p-4 shadow-2xl">
          <div className="mb-6 flex shrink-0 items-center justify-between gap-3">
            <Wordmark size="sm" />
            <button onClick={() => setOpen(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-card" aria-label="بستن">
              <Icon name="x" size={18} />
            </button>
          </div>
          <AdminNav role={role} onNavigate={() => setOpen(false)} />
        </div>
      </dialog>
    </div>
  );
}
