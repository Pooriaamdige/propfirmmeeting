import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/session";
import { Wordmark } from "@/components/layout/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "ورود به پنل مدیریت", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin/");
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="pointer-events-none absolute -top-40 start-1/3 h-96 w-96 rounded-full bg-accent/15 blur-3xl" aria-hidden />
      <div className="card relative w-full max-w-sm p-7">
        <div className="mb-6 flex justify-center">
          <Wordmark />
        </div>
        <h1 className="text-center text-lg font-bold">ورود به پنل مدیریت</h1>
        <p className="mt-1 text-center text-xs text-muted">فقط برای مدیران سایت</p>
        <LoginForm />
      </div>
    </main>
  );
}
