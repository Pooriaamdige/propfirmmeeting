import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SearchModal } from "@/components/search/SearchModal";
import { CompareTray } from "@/components/propfirms/CompareTray";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { SiteBackdrop } from "@/components/fx/SiteBackdrop";
import { getSettings } from "@/lib/services/settingsService";

// Settings (hero text, announcement, socials) are edited live from the admin panel.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <SiteBackdrop />
      <ScrollProgress />
      {settings.announcement.enabled && settings.announcement.text && <AnnouncementBar text={settings.announcement.text} href={settings.announcement.href} />}
      <Header />
      <main id="main" className="relative">
        {children}
      </main>
      <Footer social={settings.social} />
      <CompareTray />
      <SearchModal />
    </>
  );
}
