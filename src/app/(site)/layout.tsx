import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SearchModal } from "@/components/search/SearchModal";
import { CompareTray } from "@/components/propfirms/CompareTray";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { SiteBackdrop } from "@/components/fx/SiteBackdrop";
import { getSettings } from "@/lib/services/settingsService";
import { getCurrentUser } from "@/lib/auth/user-session";

// Settings (hero text, announcement, socials) are edited live from the admin panel.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser().catch(() => null)]);
  return (
    <>
      <SiteBackdrop />
      <ScrollProgress />
      {settings.announcement.enabled && settings.announcement.text && <AnnouncementBar text={settings.announcement.text} href={settings.announcement.href} />}
      <Header user={user ? { name: user.name, email: user.email } : null} />
      <main id="main" className="relative">
        {children}
      </main>
      <Footer social={settings.social} />
      <CompareTray />
      <SearchModal />
    </>
  );
}
