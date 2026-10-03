"use client";

import { useActionState, useState, type ReactNode } from "react";
import type { RuleDetail, RuleStatus } from "@/lib/types";
import { saveFirmAction } from "@/app/admin/actions";
import { Check, Field, Input, Panel, Select, TextArea } from "./ui";
import { SubmitButton } from "./client";
import { Icon } from "@/components/ui/Icon";
import { FirmLogo } from "@/components/propfirms/shared";

import { type FirmData, type FirmFormValue } from "@/lib/firm-defaults";

const RULES: { key: keyof FirmData; label: string }[] = [
  { key: "newsTrading", label: "معامله در اخبار (News Trading)" },
  { key: "weekendHolding", label: "نگه‌داشتن آخر هفته (Weekend)" },
  { key: "overnightHolding", label: "نگه‌داشتن شبانه (Overnight)" },
  { key: "eaAllowed", label: "اکسپرت (EA)" },
  { key: "copyTrading", label: "کپی ترید" },
  { key: "hedging", label: "هج" },
  { key: "consistencyRule", label: "قانون ثبات (Consistency)" },
  { key: "ipRules", label: "قوانین IP" },
  { key: "vpnVps", label: "VPN / VPS" },
];

const STATUS_LABEL: Record<RuleStatus, string> = { allowed: "مجاز", restricted: "با محدودیت", "not-allowed": "ممنوع", unknown: "نامشخص" };

const num = (v: string) => (v === "" ? null : Number(v));
const numOr = (v: string, d = 0) => (v === "" ? d : Number(v));

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-bold [&::-webkit-details-marker]:hidden">
        {title}
        <Icon name="chevron-down" size={18} className="text-muted transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-line p-5">{children}</div>
    </details>
  );
}

/** Editable list of strings. */
function StringList({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <Input value={it} placeholder={placeholder} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 rounded-lg px-3 text-neg hover:bg-neg/10" aria-label="حذف">
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, ""])} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
          <Icon name="plus" size={14} /> افزودن
        </button>
      </div>
    </div>
  );
}

export function FirmEditor({ initial, id }: { initial: FirmFormValue; id: number | null }) {
  const [v, setV] = useState<FirmFormValue>(initial);
  const [state, action] = useActionState(saveFirmAction, null);
  const d = v.data;
  const setData = (patch: Partial<FirmData>) => setV((p) => ({ ...p, data: { ...p.data, ...patch } }));

  // Keep the quick fields in sync with phase 1/2 so lists and comparisons stay consistent.
  const payload = JSON.stringify({
    ...v,
    data: {
      ...d,
      profitTarget: { phase1: d.phases[0]?.profitTarget ?? null, phase2: d.phases[1]?.profitTarget ?? null },
      platforms: d.platforms.filter(Boolean),
      highlights: d.highlights.filter(Boolean),
      limitations: d.limitations.filter(Boolean),
      payoutRules: { ...d.payoutRules, methods: d.payoutRules.methods.filter(Boolean) },
    },
  });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="payload" value={payload} />
      {id && <input type="hidden" name="id" value={id} />}

      <Section title="اطلاعات پایه">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="نام" hint="مثلاً FTMO">
            <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required dir="ltr" />
          </Field>
          <Field label="اسلاگ (آدرس صفحه)" hint={`/prop-firms/${v.slug || "slug"}/`}>
            <Input value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} required dir="ltr" />
          </Field>
          <Field label="برنامه / مدل بررسی‌شده" hint="Program">
            <Input value={d.program} onChange={(e) => setData({ program: e.target.value })} dir="ltr" />
          </Field>
          <Field label="وب‌سایت رسمی">
            <Input value={d.website} onChange={(e) => setData({ website: e.target.value })} type="url" dir="ltr" />
          </Field>
          <Field label="کشور / محل ثبت">
            <Input value={d.country ?? ""} onChange={(e) => setData({ country: e.target.value || null })} />
          </Field>
          <Field label="سال تأسیس">
            <Input value={d.foundedYear ?? ""} onChange={(e) => setData({ foundedYear: num(e.target.value) })} type="number" dir="ltr" />
          </Field>
          <Field label="توضیحات" className="md:col-span-2">
            <TextArea value={d.description} onChange={(e) => setData({ description: e.target.value })} rows={3} />
          </Field>
          <Field label="پلتفرم‌ها" hint="با کاما جدا کنید">
            <Input value={d.platforms.join(", ")} onChange={(e) => setData({ platforms: e.target.value.split(",").map((s) => s.trim()) })} dir="ltr" />
          </Field>
          <div className="flex items-end gap-3">
            <FirmLogo firm={{ name: v.name, logo: d.logo }} size={42} />
            <Field label="مونوگرام لوگو" hint="۱ تا ۳ حرف" className="flex-1">
              <Input value={d.logo.monogram} maxLength={3} onChange={(e) => setData({ logo: { ...d.logo, monogram: e.target.value } })} dir="ltr" />
            </Field>
            <Field label="رنگ" className="w-24">
              <Input type="color" value={d.logo.color} onChange={(e) => setData({ logo: { ...d.logo, color: e.target.value.toUpperCase() } })} className="p-1" />
            </Field>
          </div>
          <Field label="آدرس تصویر لوگو (اختیاری)" hint="URL" className="md:col-span-2">
            <Input value={d.logo.src ?? ""} onChange={(e) => setData({ logo: { ...d.logo, src: e.target.value || undefined } })} dir="ltr" />
          </Field>
        </div>
      </Section>

      <Section title="انتشار و وضعیت بررسی">
        <div className="grid gap-4 md:grid-cols-2">
          <Check label="منتشر شود" hint="در سایت نمایش داده شود" checked={v.published} onChange={(e) => setV({ ...v, published: e.target.checked })} />
          <Check label="پراپ‌فرم ویژه" hint="در صفحه اصلی نمایش داده شود" checked={v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} />
          <Field label="وضعیت بررسی">
            <Select value={d.status} onChange={(e) => setData({ status: e.target.value as FirmData["status"] })}>
              <option value="in-review">در حال بررسی</option>
              <option value="reviewed">بررسی‌شده</option>
              <option value="outdated">نیازمند بروزرسانی</option>
            </Select>
          </Field>
          <Field label="تاریخ آخرین بررسی قوانین">
            <Input type="date" value={d.lastReviewedAt} onChange={(e) => setData({ lastReviewedAt: e.target.value })} dir="ltr" />
          </Field>
          <Field label="ترتیب نمایش" hint="عدد کمتر = بالاتر">
            <Input type="number" value={v.sortOrder} onChange={(e) => setV({ ...v, sortOrder: numOr(e.target.value) })} dir="ltr" />
          </Field>
        </div>
      </Section>

      <Section title="هزینه چالش">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="سایز حساب مرجع" hint="USD">
            <Input type="number" value={d.challengeFee.accountSize} onChange={(e) => setData({ challengeFee: { ...d.challengeFee, accountSize: numOr(e.target.value) } })} dir="ltr" />
          </Field>
          <Field label="هزینه">
            <Input type="number" step="0.01" value={d.challengeFee.fee} onChange={(e) => setData({ challengeFee: { ...d.challengeFee, fee: numOr(e.target.value) } })} dir="ltr" />
          </Field>
          <Field label="ارز">
            <Select value={d.challengeFee.currency} onChange={(e) => setData({ challengeFee: { ...d.challengeFee, currency: e.target.value as "USD" | "EUR" } })}>
              <option>USD</option>
              <option>EUR</option>
            </Select>
          </Field>
        </div>
        <p className="mb-2 mt-5 text-sm font-medium">جدول هزینه بر اساس سایز حساب</p>
        <div className="space-y-2">
          {d.feeTiers.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_90px_40px] gap-2">
              <Input type="number" placeholder="سایز حساب" value={t.accountSize} onChange={(e) => setData({ feeTiers: d.feeTiers.map((x, j) => (j === i ? { ...x, accountSize: numOr(e.target.value) } : x)) })} dir="ltr" />
              <Input type="number" step="0.01" placeholder="هزینه" value={t.fee} onChange={(e) => setData({ feeTiers: d.feeTiers.map((x, j) => (j === i ? { ...x, fee: numOr(e.target.value) } : x)) })} dir="ltr" />
              <Select value={t.currency} onChange={(e) => setData({ feeTiers: d.feeTiers.map((x, j) => (j === i ? { ...x, currency: e.target.value as "USD" | "EUR" } : x)) })}>
                <option>USD</option>
                <option>EUR</option>
              </Select>
              <button type="button" onClick={() => setData({ feeTiers: d.feeTiers.filter((_, j) => j !== i) })} className="rounded-lg text-neg hover:bg-neg/10" aria-label="حذف">
                <Icon name="trash" size={15} className="mx-auto" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setData({ feeTiers: [...d.feeTiers, { accountSize: 10000, fee: 0, currency: d.challengeFee.currency }] })} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            <Icon name="plus" size={14} /> افزودن سایز
          </button>
        </div>
      </Section>

      <Section title="مراحل چالش">
        <div className="space-y-3">
          {d.phases.map((p, i) => {
            const upd = (patch: Partial<typeof p>) => setData({ phases: d.phases.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            return (
              <div key={i} className="grid gap-2 rounded-lg border border-line p-3 md:grid-cols-[1.3fr_repeat(4,1fr)_1fr_40px]">
                <Field label="نام مرحله">
                  <Input value={p.name} onChange={(e) => upd({ name: e.target.value })} dir="ltr" />
                </Field>
                <Field label="تارگت ٪" hint="خالی = Funded">
                  <Input type="number" step="0.1" value={p.profitTarget ?? ""} onChange={(e) => upd({ profitTarget: num(e.target.value) })} dir="ltr" />
                </Field>
                <Field label="DD روزانه ٪">
                  <Input type="number" step="0.1" value={p.dailyDrawdown} onChange={(e) => upd({ dailyDrawdown: numOr(e.target.value) })} dir="ltr" />
                </Field>
                <Field label="DD کلی ٪">
                  <Input type="number" step="0.1" value={p.maxDrawdown} onChange={(e) => upd({ maxDrawdown: numOr(e.target.value) })} dir="ltr" />
                </Field>
                <Field label="حداقل روز">
                  <Input type="number" value={p.minTradingDays ?? ""} onChange={(e) => upd({ minTradingDays: num(e.target.value) })} dir="ltr" />
                </Field>
                <Field label="محدودیت زمانی">
                  <Input value={p.timeLimit} onChange={(e) => upd({ timeLimit: e.target.value })} />
                </Field>
                <button type="button" onClick={() => setData({ phases: d.phases.filter((_, j) => j !== i) })} className="mt-6 h-10 rounded-lg text-neg hover:bg-neg/10" aria-label="حذف مرحله">
                  <Icon name="trash" size={15} className="mx-auto" />
                </button>
              </div>
            );
          })}
          {d.phases.length < 5 && (
            <button type="button" onClick={() => setData({ phases: [...d.phases, { name: `Phase ${d.phases.length + 1}`, profitTarget: 5, dailyDrawdown: 5, maxDrawdown: 10, minTradingDays: 0, timeLimit: "نامحدود" }] })} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
              <Icon name="plus" size={14} /> افزودن مرحله
            </button>
          )}
        </div>
      </Section>

      <Section title="اعداد کلیدی (کارت‌ها و مقایسه)">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="دراداون روزانه ٪">
            <Input type="number" step="0.1" value={d.dailyDrawdown.value} onChange={(e) => setData({ dailyDrawdown: { ...d.dailyDrawdown, value: numOr(e.target.value) } })} dir="ltr" />
          </Field>
          <Field label="مبنای دراداون روزانه" className="md:col-span-2">
            <Input value={d.dailyDrawdown.basis} onChange={(e) => setData({ dailyDrawdown: { ...d.dailyDrawdown, basis: e.target.value } })} />
          </Field>
          <Field label="دراداون کلی ٪">
            <Input type="number" step="0.1" value={d.maxDrawdown.value} onChange={(e) => setData({ maxDrawdown: { ...d.maxDrawdown, value: numOr(e.target.value) } })} dir="ltr" />
          </Field>
          <Field label="نوع دراداون کلی">
            <Select value={d.maxDrawdown.type} onChange={(e) => setData({ maxDrawdown: { ...d.maxDrawdown, type: e.target.value as FirmData["maxDrawdown"]["type"] } })}>
              <option value="static">Static (ثابت)</option>
              <option value="trailing">Trailing (دنباله‌دار)</option>
              <option value="relative">Relative</option>
            </Select>
          </Field>
          <Field label="مبنای دراداون کلی">
            <Input value={d.maxDrawdown.basis} onChange={(e) => setData({ maxDrawdown: { ...d.maxDrawdown, basis: e.target.value } })} />
          </Field>
          <Field label="تقسیم سود پایه ٪">
            <Input type="number" value={d.profitSplit.base} onChange={(e) => setData({ profitSplit: { ...d.profitSplit, base: numOr(e.target.value) } })} dir="ltr" />
          </Field>
          <Field label="تقسیم سود حداکثر ٪">
            <Input type="number" value={d.profitSplit.max} onChange={(e) => setData({ profitSplit: { ...d.profitSplit, max: numOr(e.target.value) } })} dir="ltr" />
          </Field>
          <Field label="حداقل روز معاملاتی">
            <Input type="number" value={d.minimumTradingDays ?? ""} onChange={(e) => setData({ minimumTradingDays: num(e.target.value) })} dir="ltr" />
          </Field>
          <Field label="لوریج فارکس">
            <Input value={d.leverage.forex} onChange={(e) => setData({ leverage: { ...d.leverage, forex: e.target.value } })} dir="ltr" placeholder="1:100" />
          </Field>
          <Field label="لوریج فلزات">
            <Input value={d.leverage.metals} onChange={(e) => setData({ leverage: { ...d.leverage, metals: e.target.value } })} dir="ltr" placeholder="1:30" />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted">تارگت سود کارت‌ها به‌صورت خودکار از مرحله ۱ و ۲ گرفته می‌شود.</p>
      </Section>

      <Section title="قوانین" defaultOpen={false}>
        <div className="space-y-3">
          {RULES.map(({ key, label }) => {
            const r = d[key] as RuleDetail;
            return (
              <div key={key} className="grid gap-2 md:grid-cols-[200px_150px_1fr] md:items-center">
                <span className="text-sm font-medium">{label}</span>
                <Select value={r.status} onChange={(e) => setData({ [key]: { ...r, status: e.target.value as RuleStatus } } as Partial<FirmData>)}>
                  {(Object.keys(STATUS_LABEL) as RuleStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
                <Input value={r.note} placeholder="توضیح" onChange={(e) => setData({ [key]: { ...r, note: e.target.value } } as Partial<FirmData>)} />
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="برداشت، افزایش سرمایه و بازگشت هزینه" defaultOpen={false}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="اولین برداشت">
            <Input value={d.payoutRules.firstPayout} onChange={(e) => setData({ payoutRules: { ...d.payoutRules, firstPayout: e.target.value } })} />
          </Field>
          <Field label="دوره برداشت">
            <Input value={d.payoutRules.frequency} onChange={(e) => setData({ payoutRules: { ...d.payoutRules, frequency: e.target.value } })} />
          </Field>
          <Field label="روش‌های پرداخت" hint="با کاما جدا کنید">
            <Input value={d.payoutRules.methods.join("، ")} onChange={(e) => setData({ payoutRules: { ...d.payoutRules, methods: e.target.value.split(/[,،]/).map((s) => s.trim()) } })} />
          </Field>
          <Field label="توضیح برداشت">
            <Input value={d.payoutRules.note} onChange={(e) => setData({ payoutRules: { ...d.payoutRules, note: e.target.value } })} />
          </Field>
          <Check label="افزایش سرمایه (Scaling) دارد" checked={d.scalingRules.available} onChange={(e) => setData({ scalingRules: { ...d.scalingRules, available: e.target.checked } })} />
          <Field label="توضیح Scaling">
            <Input value={d.scalingRules.note} onChange={(e) => setData({ scalingRules: { ...d.scalingRules, note: e.target.value } })} />
          </Field>
          <Check label="بازگشت هزینه چالش دارد" checked={d.refundPolicy.available} onChange={(e) => setData({ refundPolicy: { ...d.refundPolicy, available: e.target.checked } })} />
          <Field label="توضیح بازگشت هزینه">
            <Input value={d.refundPolicy.note} onChange={(e) => setData({ refundPolicy: { ...d.refundPolicy, note: e.target.value } })} />
          </Field>
        </div>
      </Section>

      <Section title="مزایا، محدودیت‌ها و دسترسی" defaultOpen={false}>
        <div className="grid gap-6 md:grid-cols-2">
          <StringList label="موارد قابل توجه" items={d.highlights} onChange={(highlights) => setData({ highlights })} />
          <StringList label="محدودیت‌ها و قوانین مهم" items={d.limitations} onChange={(limitations) => setData({ limitations })} />
          <Field label="یادداشت دسترسی کاربران ایرانی" className="md:col-span-2">
            <TextArea value={d.accessNote} onChange={(e) => setData({ accessNote: e.target.value })} rows={3} />
          </Field>
        </div>
      </Section>

      <Section title="سؤالات متداول و منابع" defaultOpen={false}>
        <p className="mb-2 text-sm font-medium">سؤالات متداول (در Schema FAQ هم استفاده می‌شود)</p>
        <div className="space-y-3">
          {d.faq.map((q, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-line p-3">
              <div className="flex gap-2">
                <Input placeholder="سؤال" value={q.question} onChange={(e) => setData({ faq: d.faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })} />
                <button type="button" onClick={() => setData({ faq: d.faq.filter((_, j) => j !== i) })} className="shrink-0 rounded-lg px-3 text-neg hover:bg-neg/10" aria-label="حذف">
                  <Icon name="trash" size={15} />
                </button>
              </div>
              <TextArea placeholder="پاسخ" rows={2} value={q.answer} onChange={(e) => setData({ faq: d.faq.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })} />
            </div>
          ))}
          <button type="button" onClick={() => setData({ faq: [...d.faq, { question: "", answer: "" }] })} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            <Icon name="plus" size={14} /> افزودن سؤال
          </button>
        </div>
        <p className="mb-2 mt-6 text-sm font-medium">منابع رسمی</p>
        <div className="space-y-2">
          {d.sources.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.5fr_40px] gap-2">
              <Input placeholder="عنوان" value={s.label} onChange={(e) => setData({ sources: d.sources.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} dir="ltr" />
              <Input placeholder="https://" value={s.url} onChange={(e) => setData({ sources: d.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} dir="ltr" />
              <button type="button" onClick={() => setData({ sources: d.sources.filter((_, j) => j !== i) })} className="rounded-lg text-neg hover:bg-neg/10" aria-label="حذف">
                <Icon name="trash" size={15} className="mx-auto" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setData({ sources: [...d.sources, { label: "", url: "https://" }] })} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            <Icon name="plus" size={14} /> افزودن منبع
          </button>
        </div>
      </Section>

      <Panel className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 border-line-strong bg-[var(--header-bg)] backdrop-blur-xl">
        <div className="text-sm">
          {state?.error ? (
            <span role="alert" className="text-neg">
              {state.error}
            </span>
          ) : (
            <span className="text-muted">تغییرات پس از ذخیره بلافاصله در سایت اعمال می‌شود.</span>
          )}
        </div>
        <SubmitButton>
          <Icon name="check" size={16} /> ذخیره پراپ‌فرم
        </SubmitButton>
      </Panel>
    </form>
  );
}
