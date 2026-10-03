import type { Metadata } from "next";
import { getActiveCampaign } from "@/lib/services/lotteryService";
import { formatJalaliDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/Section";
import { LotteryForm } from "@/components/forms/LotteryForm";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SpotlightCard } from "@/components/fx/Spotlight";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "قرعه‌کشی",
  description: "در قرعه‌کشی‌های دوره‌ای پراپ‌فرم میتینگ شرکت کن.",
  alternates: { canonical: "/lottery/" },
};

export default async function LotteryPage() {
  const campaign = await getActiveCampaign().catch(() => null);
  return (
    <>
      <PageHeader eyebrow="Giveaway" title="در قرعه‌کشی ما شرکت کن" subtitle="با ثبت اطلاعاتت، در قرعه‌کشی‌های دوره‌ای شرکت کن." />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {!campaign ? (
          <EmptyState icon="gift" title="در حال حاضر قرعه‌کشی فعالی نداریم." description="دوره بعدی به‌زودی اعلام می‌شود. با عضویت در خبرنامه زودتر باخبر شو." action={<LinkButton href="/#newsletter" variant="secondary">عضویت در خبرنامه</LinkButton>} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <SpotlightCard className="card relative overflow-hidden p-7">
              <div className="pointer-events-none absolute -top-24 start-1/4 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />
              <span className="float-slow inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Icon name="gift" size={28} />
              </span>
              <h2 className="mt-6 text-2xl font-black">{campaign.title}</h2>
              {campaign.description && <p className="mt-3 leading-8 text-muted">{campaign.description}</p>}
              <dl className="mt-6 space-y-3 text-sm">
                {campaign.prize && (
                  <div className="flex items-center justify-between rounded-lg border border-accent-2/25 bg-accent-2/5 px-4 py-3">
                    <dt className="text-muted">جایزه</dt>
                    <dd className="font-bold text-accent-2">{campaign.prize}</dd>
                  </div>
                )}
                {campaign.endsAt && (
                  <div className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
                    <dt className="text-muted">پایان ثبت‌نام</dt>
                    <dd className="font-semibold">{formatJalaliDate(campaign.endsAt)}</dd>
                  </div>
                )}
              </dl>
              <ul className="mt-6 space-y-3 text-sm text-muted">
                {["ثبت‌نام رایگان و یک‌بار برای هر دوره", "اعلام نتایج از طریق ایمیل و تلگرام", "اطلاعات شما محرمانه باقی می‌ماند"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Icon name="check" size={16} className="text-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </SpotlightCard>
            <div className="card border-beam p-6 md:p-8">
              <LotteryForm />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
