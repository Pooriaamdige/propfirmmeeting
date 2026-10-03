"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/components/layout/Logo";
import { AdminNav } from "./client";

export function AdminMobileNav({ role }: { role: "admin" | "editor" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(true)} className="rounded-md p-2" aria-label="منو" aria-expanded={open}>
        <Icon name="menu" size={20} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 start-0 w-72 border-e border-line bg-bg p-4">
            <div className="mb-6 flex items-center justify-between">
              <Wordmark size="sm" />
              <button onClick={() => setOpen(false)} className="rounded-md p-2" aria-label="بستن">
                <Icon name="x" size={18} />
              </button>
            </div>
            <AdminNav role={role} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
