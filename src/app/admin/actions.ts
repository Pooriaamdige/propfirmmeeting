"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { createSession, destroySession, requireAdmin } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { invalidateContent } from "@/lib/services/contentCache";
import { articleSchema, campaignSchema, couponSchema, firmSchema, settingsSchema, userSchema } from "@/lib/admin-schemas";
import { clearFailures, recordFailure, tooManyFailures } from "@/lib/spam";

export type FormState = { error?: string; fieldErrors?: Record<string, string[] | undefined>; ok?: boolean; email?: string } | null;

/** "hero.title" style FormData keys → nested object. */
function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    if (key.startsWith("$")) continue; // React internals
    const parts = key.split(".");
    let cur = out as Record<string, unknown>;
    parts.slice(0, -1).forEach((p) => (cur = (cur[p] ??= {}) as Record<string, unknown>));
    cur[parts[parts.length - 1]] = value;
  }
  return out;
}

function isUnique(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

function refresh(...paths: string[]) {
  invalidateContent();
  for (const p of ["/", ...paths]) revalidatePath(p);
}

const fail = (error: z.ZodError | string): FormState => (typeof error === "string" ? { error } : { error: "برخی فیلدها معتبر نیستند.", fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]> });

/* --------------------------------- Auth --------------------------------- */

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const key = `admin-login:${ip}`;
  if (tooManyFailures(key)) return { error: "تلاش‌های ناموفق زیاد. ۱۵ دقیقه دیگر دوباره امتحان کنید." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const d = await db();
  const [user] = await d.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    recordFailure(key);
    return { error: "ایمیل یا رمز عبور اشتباه است.", email };
  }
  clearFailures(key);
  await createSession(user.id);
  redirect("/admin/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login/");
}

/* ------------------------------- Prop firms ------------------------------- */

export async function saveFirmAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("payload") ?? ""));
  } catch {
    return fail("داده فرم نامعتبر است.");
  }
  const parsed = firmSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `خطا در «${first.path.join(" › ")}»: ${first.message}` };
  }
  const { slug, name, published, featured, sortOrder, data } = parsed.data;
  const d = await db();
  try {
    if (id) await d.update(schema.propFirms).set({ slug, name, published, featured, sortOrder, data, updatedAt: new Date() }).where(eq(schema.propFirms.id, id));
    else await d.insert(schema.propFirms).values({ slug, name, published, featured, sortOrder, data });
  } catch (err) {
    if (isUnique(err)) return fail("این اسلاگ قبلاً استفاده شده است.");
    throw err;
  }
  refresh("/prop-firms/", `/prop-firms/${slug}/`, "/compare/", "/coupons/");
  redirect("/admin/prop-firms/?saved=1");
}

export async function deleteFirmAction(fd: FormData) {
  await requireAdmin();
  const d = await db();
  await d.delete(schema.propFirms).where(eq(schema.propFirms.id, Number(fd.get("id"))));
  refresh("/prop-firms/", "/compare/", "/coupons/");
  redirect("/admin/prop-firms/?saved=1");
}

export async function toggleFirmAction(fd: FormData) {
  await requireAdmin();
  const d = await db();
  const id = Number(fd.get("id"));
  const field = fd.get("field") === "featured" ? "featured" : "published";
  const [row] = await d.select().from(schema.propFirms).where(eq(schema.propFirms.id, id));
  if (row) await d.update(schema.propFirms).set({ [field]: !row[field], updatedAt: new Date() }).where(eq(schema.propFirms.id, id));
  refresh("/prop-firms/", "/admin/prop-firms/");
}

/* --------------------------------- Coupons -------------------------------- */

export async function saveCouponAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const parsed = couponSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error);
  const d = await db();
  if (id) await d.update(schema.coupons).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.coupons.id, id));
  else await d.insert(schema.coupons).values(parsed.data);
  refresh("/coupons/");
  redirect("/admin/coupons/?saved=1");
}

export async function deleteCouponAction(fd: FormData) {
  await requireAdmin();
  const d = await db();
  await d.delete(schema.coupons).where(eq(schema.coupons.id, Number(fd.get("id"))));
  refresh("/coupons/");
  redirect("/admin/coupons/?saved=1");
}

export async function toggleCouponAction(fd: FormData) {
  await requireAdmin();
  const d = await db();
  const id = Number(fd.get("id"));
  const [row] = await d.select().from(schema.coupons).where(eq(schema.coupons.id, id));
  if (row) await d.update(schema.coupons).set({ active: !row.active, updatedAt: new Date() }).where(eq(schema.coupons.id, id));
  refresh("/coupons/", "/admin/coupons/");
}

/* -------------------------------- Articles -------------------------------- */

export async function saveArticleAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const parsed = articleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error);
  const d = await db();
  try {
    if (id) await d.update(schema.articles).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.articles.id, id));
    else await d.insert(schema.articles).values(parsed.data);
  } catch (err) {
    if (isUnique(err)) return fail("این اسلاگ قبلاً استفاده شده است.");
    throw err;
  }
  refresh("/blog/", `/blog/${parsed.data.slug}/`);
  redirect("/admin/articles/?saved=1");
}

export async function deleteArticleAction(fd: FormData) {
  await requireAdmin();
  const d = await db();
  await d.delete(schema.articles).where(eq(schema.articles.id, Number(fd.get("id"))));
  refresh("/blog/");
  redirect("/admin/articles/?saved=1");
}

/* --------------------------------- Lottery -------------------------------- */

export async function saveCampaignAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const parsed = campaignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error);
  const d = await db();
  try {
    // Only one campaign can be active at a time.
    if (parsed.data.active) await d.update(schema.lotteryCampaigns).set({ active: false }).where(id ? ne(schema.lotteryCampaigns.id, id) : undefined);
    if (id) await d.update(schema.lotteryCampaigns).set(parsed.data).where(eq(schema.lotteryCampaigns.id, id));
    else await d.insert(schema.lotteryCampaigns).values(parsed.data);
  } catch (err) {
    if (isUnique(err)) return fail("این شناسه قبلاً استفاده شده است.");
    throw err;
  }
  refresh("/lottery/");
  redirect("/admin/lottery/?saved=1");
}

export async function deleteRegistrationAction(fd: FormData) {
  await requireAdmin();
  const d = await db();
  await d.delete(schema.lotteryRegistrations).where(eq(schema.lotteryRegistrations.id, Number(fd.get("id"))));
  revalidatePath("/admin/lottery/");
}

export async function deleteSubscriberAction(fd: FormData) {
  await requireAdmin();
  const d = await db();
  await d.delete(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.id, Number(fd.get("id"))));
  revalidatePath("/admin/newsletter/");
}

/* -------------------------------- Settings -------------------------------- */

export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("admin");
  const obj = formToObject(fd) as { announcement?: Record<string, unknown> };
  obj.announcement = { enabled: false, ...obj.announcement };
  const parsed = settingsSchema.safeParse(obj);
  if (!parsed.success) return fail(parsed.error);
  const d = await db();
  for (const [key, value] of Object.entries(parsed.data)) {
    await d.insert(schema.siteSettings).values({ key, value }).onConflictDoUpdate({ target: schema.siteSettings.key, set: { value, updatedAt: new Date() } });
  }
  refresh("/coupons/", "/lottery/");
  redirect("/admin/settings/?saved=1");
}

/* ---------------------------------- Users --------------------------------- */

export async function createUserAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("admin");
  const parsed = userSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error);
  const d = await db();
  try {
    await d.insert(schema.adminUsers).values({ email: parsed.data.email, name: parsed.data.name, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) });
  } catch (err) {
    if (isUnique(err)) return fail("این ایمیل قبلاً ثبت شده است.");
    throw err;
  }
  redirect("/admin/users/?saved=1");
}

export async function deleteUserAction(fd: FormData) {
  const me = await requireAdmin("admin");
  const id = Number(fd.get("id"));
  if (id === me.id) redirect("/admin/users/?error=self");
  const d = await db();
  await d.delete(schema.adminUsers).where(and(eq(schema.adminUsers.id, id), ne(schema.adminUsers.id, me.id)));
  redirect("/admin/users/?saved=1");
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8) return { error: "رمز جدید حداقل ۸ کاراکتر باشد." };
  const d = await db();
  const [user] = await d.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, me.id));
  if (!user || !(await verifyPassword(current, user.passwordHash))) return { error: "رمز فعلی اشتباه است." };
  await d.update(schema.adminUsers).set({ passwordHash: await hashPassword(next) }).where(eq(schema.adminUsers.id, me.id));
  return { ok: true };
}
