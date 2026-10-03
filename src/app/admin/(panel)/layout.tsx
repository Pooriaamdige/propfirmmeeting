import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { Wordmark } from "@/components/layout/Logo";
import { AdminNav } from "@/components/admin/client";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { logoutAction } from "../actions";

export const metadata: Metadata = { title: { default: "پنل مدیریت", template: "%s | پنل مدیریت" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-e border-line bg-surface/50 p-4 lg:flex">
        <Link href="/admin/" className="mb-8 mt-2 px-2">
          <Wordmark size="sm" />
        </Link>
        <AdminNav role={user.role} />
        <div className="mt-auto space-y-3 border-t border-line pt-4">
          <Link href="/" target="_blank" className="flex items-center gap-2 px-3 text-sm text-muted hover:text-fg">
            <Icon name="external" size={15} />
            مشاهده سایت
          </Link>
          <div className="flex items-center justify-between px-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name || user.email}</p>
              <p className="truncate text-[11px] text-faint" dir="ltr">
                {user.email}
              </p>
            </div>
            <form action={logoutAction}>
              <button className="rounded-md p-2 text-muted hover:bg-card hover:text-neg" aria-label="خروج">
                <Icon name="logout" size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-[var(--header-bg)] px-4 backdrop-blur-xl lg:px-8">
          <AdminMobileNav role={user.role} />
          <span className="hidden text-sm text-muted lg:inline">پنل مدیریت PropFirm Meeting</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logoutAction} className="lg:hidden">
              <button className="rounded-md p-2 text-muted" aria-label="خروج">
                <Icon name="logout" size={16} />
              </button>
            </form>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
