import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/user-session";
import { getAccount } from "@/lib/journal/service";
import { AccountForm } from "@/components/journal/AccountForm";
import { Crumbs } from "@/components/journal/ui";
import { ConfirmButton } from "@/components/admin/client";
import { Icon } from "@/components/ui/Icon";
import { firmPresets } from "@/lib/journal/presets";
import { archiveAccountAction, deleteAccountAction } from "../../../actions";

export const metadata: Metadata = { title: "ویرایش حساب", robots: { index: false } };

export default async function EditAccountPage({ params }: PageProps<"/journal/accounts/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser(`/journal/accounts/${id}/edit/`);
  const a = await getAccount(user.id, Number(id));
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Crumbs items={[{ href: "/journal/", label: "ژورنال" }, { href: `/journal/accounts/${a.id}/`, label: a.name }, { label: "ویرایش" }]} />
      <h1 className="mb-6 text-2xl font-black">ویرایش حساب</h1>
      <AccountForm firms={await firmPresets()} value={{ id: a.id, name: a.name, type: a.type, firmId: a.firmId, firmName: a.firmName, broker: a.broker, platform: a.platform, currency: a.currency, initialBalance: a.initialBalance, startedAt: a.startedAt, rules: a.rules ?? null }} />
      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <form action={archiveAccountAction}>
          <input type="hidden" name="id" value={a.id} />
          <button className="text-sm text-muted hover:text-fg">{a.archived ? "خروج از بایگانی" : "بایگانی حساب"}</button>
        </form>
        <ConfirmButton action={deleteAccountAction} id={a.id} message={`حساب «${a.name}» و همه معاملاتش برای همیشه حذف شود؟`} className="text-sm">
          <Icon name="trash" size={14} /> حذف حساب
        </ConfirmButton>
      </div>
    </div>
  );
}
