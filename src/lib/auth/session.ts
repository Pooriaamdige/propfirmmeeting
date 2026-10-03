import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, lt } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/lib/db";

export const SESSION_COOKIE = "pfm_admin";
const SESSION_DAYS = 7;

export type AdminUser = { id: number; email: string; name: string; role: "admin" | "editor" };

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Secure cookies in production unless COOKIE_SECURE=false (only for sites served over plain HTTP). */
const secureCookie = () => process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  const d = await db();
  await d.insert(schema.adminSessions).values({ id: sha256(token), userId, expiresAt });
  await d.update(schema.adminUsers).set({ lastLoginAt: new Date() }).where(eq(schema.adminUsers.id, userId));
  await d.delete(schema.adminSessions).where(lt(schema.adminSessions.expiresAt, new Date()));
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: secureCookie(), path: "/", expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const d = await db();
    await d.delete(schema.adminSessions).where(eq(schema.adminSessions.id, sha256(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** The signed-in admin for this request, or null. Memoised per request. */
export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const d = await db();
  const rows = await d
    .select({ id: schema.adminUsers.id, email: schema.adminUsers.email, name: schema.adminUsers.name, role: schema.adminUsers.role })
    .from(schema.adminSessions)
    .innerJoin(schema.adminUsers, eq(schema.adminSessions.userId, schema.adminUsers.id))
    .where(and(eq(schema.adminSessions.id, sha256(token)), gt(schema.adminSessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0];
  return u ? { ...u, role: u.role === "editor" ? "editor" : "admin" } : null;
});

/** Use at the top of every admin page and server action. */
export async function requireAdmin(role?: "admin"): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login/");
  if (role === "admin" && user.role !== "admin") redirect("/admin/?error=forbidden");
  return user;
}
