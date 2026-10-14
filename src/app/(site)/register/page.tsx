import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user-session";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "ثبت‌نام", robots: { index: false }, alternates: { canonical: "/register/" } };

const safe = (v: unknown) => (typeof v === "string" && /^\/(journal|account)(\/|$)/.test(v) ? v : "/journal/");

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const next = safe((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="ساخت حساب رایگان" subtitle="ژورنال معاملات، آمار و پایش قوانین پراپ — رایگان.">
      <RegisterForm next={next} />
    </AuthShell>
  );
}
