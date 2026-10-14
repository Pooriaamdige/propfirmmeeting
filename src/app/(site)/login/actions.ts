"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createUserSession, destroyUserSession, requireUser } from "@/lib/auth/user-session";
import { clearFailures, rateLimited, recordFailure, tooManyFailures } from "@/lib/spam";

export type AuthState = { error?: string; fieldErrors?: Record<string, string[] | undefined>; email?: string; name?: string; ok?: boolean } | null;

/** Only allow redirects to our own journal/account pages. */
const safeNext = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return /^\/(journal|account)(\/|$)/.test(s) ? s : "/journal/";
};

async function ip() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "نام را وارد کنید").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("ایمیل معتبر نیست")),
  password: z.string().min(8, "رمز عبور حداقل ۸ کاراکتر").max(200),
});

export async function registerAction(_: AuthState, fd: FormData): Promise<AuthState> {
  if (rateLimited(`register:${await ip()}`)) return { error: "تعداد درخواست‌ها زیاد است. چند دقیقه دیگر تلاش کنید." };
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "اطلاعات فرم معتبر نیست.", fieldErrors: z.flattenError(parsed.error).fieldErrors, email: String(fd.get("email") ?? ""), name: String(fd.get("name") ?? "") };
  const d = await db();
  const [exists] = await d.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, parsed.data.email)).limit(1);
  if (exists) return { error: "با این ایمیل قبلاً حساب ساخته شده است. وارد شوید.", email: parsed.data.email, name: parsed.data.name };
  const [user] = await d.insert(schema.users).values({ email: parsed.data.email, name: parsed.data.name, passwordHash: await hashPassword(parsed.data.password) }).returning({ id: schema.users.id });
  await createUserSession(user.id);
  redirect(safeNext(fd.get("next")));
}

export async function loginAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const key = `user-login:${await ip()}`;
  if (tooManyFailures(key)) return { error: "تلاش‌های ناموفق زیاد. ۱۵ دقیقه دیگر دوباره امتحان کنید." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const d = await db();
  const [user] = await d.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user || user.disabled || !(await verifyPassword(password, user.passwordHash))) {
    recordFailure(key);
    return { error: "ایمیل یا رمز عبور اشتباه است.", email };
  }
  clearFailures(key);
  await createUserSession(user.id);
  redirect(safeNext(fd.get("next")));
}

export async function logoutAction() {
  await destroyUserSession();
  redirect("/");
}

export async function updateProfileAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const user = await requireUser("/account/");
  const name = String(fd.get("name") ?? "").trim();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const d = await db();
  if (name.length >= 2) await d.update(schema.users).set({ name }).where(eq(schema.users.id, user.id));
  if (next) {
    if (next.length < 8) return { error: "رمز جدید حداقل ۸ کاراکتر باشد." };
    const [row] = await d.select().from(schema.users).where(eq(schema.users.id, user.id));
    if (!row || !(await verifyPassword(current, row.passwordHash))) return { error: "رمز فعلی اشتباه است." };
    await d.update(schema.users).set({ passwordHash: await hashPassword(next) }).where(eq(schema.users.id, user.id));
  }
  return { ok: true };
}
