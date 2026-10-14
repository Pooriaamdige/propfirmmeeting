import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/user-session";
import { PageHeader } from "@/components/ui/Section";
import { ProfileForm } from "@/components/auth/AuthForms";
import { logoutAction } from "../login/actions";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "حساب کاربری", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser("/account/");
  return (
    <>
      <PageHeader eyebrow="Account" title="حساب کاربری" subtitle={user.email} />
      <div className="mx-auto grid max-w-3xl gap-6 px-4 py-10 sm:px-6">
        <div className="card p-6">
          <ProfileForm name={user.name} />
        </div>
        <form action={logoutAction}>
          <button className="inline-flex items-center gap-2 text-sm text-neg hover:underline">
            <Icon name="logout" size={15} /> خروج از حساب
          </button>
        </form>
      </div>
    </>
  );
}
