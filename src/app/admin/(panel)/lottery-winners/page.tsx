import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { FIRST_LOTTERY_WEEK } from "@/lib/lottery-winners";
import { Badge, Flash, PageTitle } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/client";
import { LotteryWeekForm } from "@/components/admin/LotteryWeekForm";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { deleteLotteryWeekAction } from "../../actions";

export default async function AdminLotteryWinners({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const d = await db();
  const weeks = await d.select().from(schema.lotteryWeeks).orderBy(desc(schema.lotteryWeeks.week));
  const editing = typeof sp.edit === "string" ? weeks.find((w) => w.id === Number(sp.edit)) : undefined;
  const showForm = sp.edit === "new" || !!editing;
  const firms = showForm ? await d.select({ name: schema.propFirms.name }).from(schema.propFirms).orderBy(asc(schema.propFirms.name)) : [];
  const nextWeek = Math.max(FIRST_LOTTERY_WEEK, (weeks[0]?.week ?? FIRST_LOTTERY_WEEK - 1) + 1);

  return <>
    <PageTitle title="برندگان قرعه‌کشی" subtitle="هفته‌ها و نتایج را ثبت، ویرایش و منتشر کنید." action={<Link href="/admin/lottery-winners/?edit=new" className={buttonClass("primary")}><Icon name="plus" size={16} /> هفته جدید</Link>} />
    <Flash saved={sp.saved === "1"} error={sp.edit && !showForm ? "هفته مورد نظر پیدا نشد." : null} />
    {showForm && <div className="mb-6"><LotteryWeekForm key={editing?.id ?? "new"} week={editing ?? null} nextWeek={nextWeek} firms={firms.map((f) => f.name)} /></div>}
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <p>{weeks.length.toLocaleString("fa-IR")} هفته ثبت‌شده</p>
      <Link href="/lottery-winners/" className="inline-flex items-center gap-2 text-accent hover:underline">مشاهده صفحه برندگان <Icon name="external" size={14} /></Link>
    </div>
    {!weeks.length && <div className="card p-10 text-center"><Icon name="gift" size={32} className="mx-auto mb-4 text-accent-2" /><p className="font-bold">اولین نتایج را ثبت کنید</p><p className="mt-2 text-sm leading-7 text-muted">فرم هفته جدید از شماره ۵۲ شروع می‌شود. هفته‌های گذشته را هم می‌توانید با شماره دلخواه اضافه کنید.</p></div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {weeks.map((week) => <article key={week.id} className="card p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">هفته {week.week.toLocaleString("fa-IR")}</h2><Badge tone={week.published ? "pos" : "muted"}>{week.published ? "منتشرشده" : "پیش‌نویس"}</Badge></div>
        <p className="mt-3 text-sm text-muted">{week.winners.length.toLocaleString("fa-IR")} برنده{week.drawnOn && `، ${new Date(`${week.drawnOn}T12:00:00Z`).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}`}</p>
        <p className="mt-2 truncate text-xs text-faint">{[...new Set(week.winners.map((w) => w.firmName))].join("، ") || "هنوز برنده‌ای اضافه نشده است."}</p>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <Link href={`/admin/lottery-winners/?edit=${week.id}`} className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-accent"><Icon name="edit" size={15} /> ویرایش نتایج</Link>
          <ConfirmButton action={deleteLotteryWeekAction} id={week.id} message={`هفته ${week.week} و تمام نتایج آن حذف شود؟`}><Icon name="trash" size={15} /> حذف</ConfirmButton>
        </div>
      </article>)}
    </div>
  </>;
}
