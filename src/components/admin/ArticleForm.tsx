"use client";

import { useActionState, useState } from "react";
import type { schema } from "@/lib/db/schema-types";
import { articleCategories } from "@/lib/categories";
import { saveArticleAction } from "@/app/admin/actions";
import { Markdown } from "@/components/blog/Markdown";
import { Check, Field, Input, Panel, Select, TextArea } from "./ui";
import { SubmitButton } from "./client";
import { Icon } from "@/components/ui/Icon";

type ArticleRow = typeof schema.articles.$inferSelect;

export function ArticleForm({ article }: { article: ArticleRow | null }) {
  const [state, action] = useActionState(saveArticleAction, null);
  const [body, setBody] = useState(article?.body ?? "## عنوان بخش\n\nمتن پاراگراف…\n\n- مورد اول\n- مورد دوم");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <form action={action} className="space-y-4">
      {article && <input type="hidden" name="id" value={article.id} />}
      <Panel>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="عنوان" error={err("title")} className="md:col-span-2">
            <Input name="title" defaultValue={article?.title} required />
          </Field>
          <Field label="اسلاگ" hint="/blog/…" error={err("slug")}>
            <Input name="slug" defaultValue={article?.slug} required dir="ltr" />
          </Field>
          <Field label="دسته‌بندی">
            <Select name="category" defaultValue={article?.category ?? "education"}>
              {articleCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="خلاصه" hint="در کارت‌ها و توضیحات SEO" error={err("excerpt")} className="md:col-span-2">
            <TextArea name="excerpt" defaultValue={article?.excerpt} rows={2} />
          </Field>
          <Field label="نویسنده">
            <Input name="author" defaultValue={article?.author ?? "تیم تحریریه"} />
          </Field>
          <Field label="زمان مطالعه (دقیقه)">
            <Input name="readingMinutes" type="number" min={1} defaultValue={article?.readingMinutes ?? 5} dir="ltr" />
          </Field>
          <Field label="تاریخ انتشار">
            <Input name="publishedAt" type="date" defaultValue={(article?.publishedAt ?? new Date()).toISOString().slice(0, 10)} dir="ltr" />
          </Field>
          <div className="flex items-end">
            <Check name="published" label="منتشر شود" defaultChecked={article?.published ?? true} />
          </div>
        </div>
      </Panel>
      <Panel
        title="متن مقاله"
        actions={
          <div className="flex rounded-lg border border-line p-0.5 text-xs">
            {(["write", "preview"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-md px-3 py-1 ${tab === t ? "bg-surface font-semibold" : "text-muted"}`}>
                {t === "write" ? "نوشتن" : "پیش‌نمایش"}
              </button>
            ))}
          </div>
        }
      >
        <input type="hidden" name="body" value={body} />
        {tab === "write" ? (
          <TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={18} className="font-sans" />
        ) : (
          <div className="rounded-lg border border-line p-5">
            <Markdown source={body} />
          </div>
        )}
        <p className="mt-2 text-xs leading-6 text-muted">
          راهنما: <code>## تیتر</code> · خط خالی بین پاراگراف‌ها · <code>- مورد</code> برای لیست · <code>**پررنگ**</code> · <code>[متن](https://…)</code> برای لینک
        </p>
        {err("body") && <p className="mt-1 text-xs text-neg">{err("body")}</p>}
      </Panel>
      <div className="flex items-center justify-between gap-3">
        {state?.error ? <p className="text-sm text-neg">{state.error}</p> : <span />}
        <SubmitButton>
          <Icon name="check" size={16} /> ذخیره مقاله
        </SubmitButton>
      </div>
    </form>
  );
}
