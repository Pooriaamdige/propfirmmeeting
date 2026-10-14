import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, lt } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/lib/db";

/** Site-user sessions (journal). Separate cookie and table from the admin panel. */
export const USER_COOKIE = "pfm_user";
const SESSION_DAYS = 30;

export type SiteUser = { id: number; email: string; name: string };

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const secureCookie = () => process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";

export async function createUserSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  const d = await db();
  await d.insert(schema.userSessions).values({ id: sha256(token), userId, expiresAt });
  await d.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, userId));
  await d.delete(schema.userSessions).where(lt(schema.userSessions.expiresAt, new Date()));
  (await cookies()).set(USER_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: secureCookie(), path: "/", expires: expiresAt });
}

export async function destroyUserSession() {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  if (token) {
    const d = await db();
    await d.delete(schema.userSessions).where(eq(schema.userSessions.id, sha256(token)));
  }
  jar.delete(USER_COOKIE);
}

/** The signed-in site user for this request, or null. Memoised per request. */
export const getCurrentUser = cache(async (): Promise<SiteUser | null> => {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  const d = await db();
  const rows = await d
    .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, disabled: schema.users.disabled })
    .from(schema.userSessions)
    .innerJoin(schema.users, eq(schema.userSessions.userId, schema.users.id))
    .where(and(eq(schema.userSessions.id, sha256(token)), gt(schema.userSessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0];
  return u && !u.disabled ? { id: u.id, email: u.email, name: u.name } : null;
});

/** Use at the top of every journal page and server action. */
export async function requireUser(next = "/journal/"): Promise<SiteUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login/?next=${encodeURIComponent(next)}`);
  return user;
}
