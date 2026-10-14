import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user-session";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "ورود", robots: { index: false }, alternates: { canonical: "/login/" } };

const safe = (v: unknown) => (typeof v === "string" && /^\/(journal|account)(\/|$)/.test(v) ? v : "/journal/");

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safe((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="ورود به حساب" subtitle="برای دسترسی به ژورنال معاملاتی وارد شو.">
      <LoginForm next={next} />
    </AuthShell>
  );
}
