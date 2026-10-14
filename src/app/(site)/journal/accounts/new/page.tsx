import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/user-session";
import { firmPresets } from "@/lib/journal/presets";
import { AccountForm } from "@/components/journal/AccountForm";
import { Crumbs } from "@/components/journal/ui";

export const metadata: Metadata = { title: "حساب جدید ژورنال", robots: { index: false } };

export default async function NewAccountPage() {
  await requireUser("/journal/accounts/new/");
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Crumbs items={[{ href: "/journal/", label: "ژورنال" }, { label: "حساب جدید" }]} />
      <h1 className="mb-6 text-2xl font-black">حساب جدید</h1>
      <AccountForm firms={await firmPresets()} value={{ name: "", type: "challenge", firmId: null, firmName: "", broker: "", platform: "MT5", currency: "USD", initialBalance: "", startedAt: new Date().toISOString().slice(0, 10), rules: null }} />
    </div>
  );
}
