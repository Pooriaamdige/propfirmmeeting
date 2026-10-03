import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Badge, Flash, PageTitle, Panel, Table, fmtDate } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/client";
import { CampaignForm } from "@/components/admin/CampaignForm";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { deleteRegistrationAction } from "../../actions";

export default async function AdminLottery({ searchParams }: PageProps<"/admin/lottery">) {
  const sp = await searchParams;
  const d = await db();
  const campaigns = await d.select().from(schema.lotteryCampaigns).orderBy(desc(schema.lotteryCampaigns.id));
  const counts = await d.select({ c: schema.lotteryRegistrations.campaignId, n: count() }).from(schema.lotteryRegistrations).groupBy(schema.lotteryRegistrations.campaignId);
  const selected = typeof sp.campaign === "string" ? sp.campaign : (campaigns.find((c) => c.active) ?? campaigns[0])?.slug;
  const editing = typeof sp.edit === "string" ? (sp.edit === "new" ? "new" : campaigns.find((c) => c.id === Number(sp.edit)) ?? null) : null;
  const regs = selected ? await d.select().from(schema.lotteryRegistrations).where(eq(schema.lotteryRegistrations.campaignId, selected)).orderBy(desc(schema.lotteryRegistrations.createdAt)).limit(500) : [];

  return (
    <>
      <PageTitle
        title="قرعه‌کشی"
        subtitle="کمپین‌ها و ثبت‌نام‌کنندگان — در هر زمان فقط یک کمپین فعال است"
        action={
          <Link href="/admin/lottery/?edit=new" className={buttonClass("primary")}>
            <Icon name="plus" size={16} /> کمپین جدید
          </Link>
        }
      />
      <Flash saved={sp.saved === "1"} />
      {editing && (
        <div className="mb-6">
          <CampaignForm campaign={editing === "new" ? null : editing} />
        </div>
      )}
      <Table head={["کمپین", "جایزه", "بازه", "ثبت‌نام", "وضعیت", ""]} empty={campaigns.length === 0}>
        {campaigns.map((c) => (
          <tr key={c.id} className={c.slug === selected ? "bg-accent/[0.04]" : ""}>
            <td className="px-4 py-3">
              <Link href={`/admin/lottery/?campaign=${c.slug}`} className="font-medium hover:text-accent">
                {c.title}
              </Link>
              <span className="block text-[11px] text-faint" dir="ltr">{c.slug}</span>
            </td>
            <td className="px-4 py-3 text-xs">{c.prize || "—"}</td>
            <td className="px-4 py-3 text-xs text-muted">
              {fmtDate(c.startsAt)} ← {fmtDate(c.endsAt)}
            </td>
            <td className="num px-4 py-3">{counts.find((x) => x.c === c.slug)?.n ?? 0}</td>
            <td className="px-4 py-3">{c.active ? <Badge tone="pos">فعال</Badge> : <Badge>غیرفعال</Badge>}</td>
            <td className="px-4 py-3 text-end">
              <Link href={`/admin/lottery/?edit=${c.id}&campaign=${c.slug}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-surface">
                <Icon name="edit" size={13} /> ویرایش
              </Link>
            </td>
          </tr>
        ))}
      </Table>

      {selected && (
        <Panel
          className="mt-6"
          title={`ثبت‌نام‌کنندگان — ${selected}`}
          actions={
            <a href={`/admin/export/registrations/?campaign=${encodeURIComponent(selected)}`} className={buttonClass("secondary", "sm")}>
              <Icon name="download" size={14} /> خروجی CSV
            </a>
          }
        >
          <Table head={["نام", "ایمیل", "تلگرام", "تلفن", "تاریخ", ""]} empty={regs.length === 0}>
            {regs.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5">{r.name}</td>
                <td className="px-4 py-2.5 text-xs" dir="ltr">{r.email}</td>
                <td className="px-4 py-2.5 text-xs" dir="ltr">{r.telegramId}</td>
                <td className="px-4 py-2.5 text-xs" dir="ltr">{r.phone}</td>
                <td className="px-4 py-2.5 text-xs text-muted">{fmtDate(r.createdAt)}</td>
                <td className="px-4 py-2.5 text-end">
                  <ConfirmButton action={deleteRegistrationAction} id={r.id} message="این ثبت‌نام حذف شود؟">
                    <Icon name="trash" size={13} />
                  </ConfirmButton>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}
    </>
  );
}
