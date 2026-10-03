import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/services/settingsService";
import { Flash, PageTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettings({ searchParams }: PageProps<"/admin/settings">) {
  await requireAdmin("admin");
  const sp = await searchParams;
  return (
    <>
      <PageTitle title="تنظیمات سایت" subtitle="متن‌های صفحه اصلی، نوار اطلاعیه و شبکه‌های اجتماعی" />
      <Flash saved={sp.saved === "1"} />
      <SettingsForm settings={await getSettings()} />
    </>
  );
}
