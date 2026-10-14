import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/user-session";
import { getAccount } from "@/lib/journal/service";
import { ImportForm } from "@/components/journal/ImportForm";
import { Crumbs } from "@/components/journal/ui";
import { CSV_COLUMNS } from "@/lib/journal/csv";

export const metadata: Metadata = { title: "وارد کردن معاملات", robots: { index: false } };

export default async function ImportPage({ params }: PageProps<"/journal/accounts/[id]/import">) {
  const { id } = await params;
  const user = await requireUser(`/journal/accounts/${id}/import/`);
  const a = await getAccount(user.id, Number(id));
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Crumbs items={[{ href: "/journal/", label: "ژورنال" }, { href: `/journal/accounts/${a.id}/`, label: a.name }, { label: "وارد کردن CSV" }]} />
      <h1 className="text-2xl font-black">وارد کردن معاملات از CSV</h1>
      <p className="mb-6 mt-2 text-sm leading-7 text-muted">
        فایل باید ردیف عنوان داشته باشد. ستون‌های قالب ما یا نام ستون‌های رایج متاتریدر (Time, Symbol, Type, Volume, Price, S / L, T / P, Commission, Swap, Profit) پذیرفته می‌شوند. ردیف‌های balance/deposit نادیده گرفته می‌شوند. ابتدا «بررسی فایل» را بزن.
      </p>
      <ImportForm accountId={a.id} />
      <div className="card mt-6 p-5 text-sm">
        <h2 className="mb-2 font-bold">قالب ستون‌ها</h2>
        <code className="block overflow-x-auto whitespace-nowrap rounded-lg bg-surface p-3 text-xs" dir="ltr">
          {CSV_COLUMNS.join(",")}
        </code>
        <ul className="mt-3 space-y-1 text-xs leading-6 text-muted">
          <li>• side: buy یا sell · تاریخ‌ها: 2026-10-01 14:30 یا 2026.10.01 14:30:00</li>
          <li>• commission به‌صورت هزینه (مثبت یا منفی فرقی ندارد) · swap علامت‌دار</li>
          <li>• tags و mistakes: چند مورد را با | جدا کن</li>
          <li>• اگر profit یا pips خالی باشد، برای جفت‌ارزهای دلاری و طلا محاسبه می‌شود</li>
        </ul>
        <a href={`/journal/accounts/${a.id}/export/?template=1`} className="mt-3 inline-block text-accent hover:underline">
          دانلود فایل نمونه
        </a>
      </div>
    </div>
  );
}
