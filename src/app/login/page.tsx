import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export const metadata: Metadata = { title: "ورود / ثبت‌نام", robots: { index: false }, alternates: { canonical: "/login/" } };

export default function LoginPage() {
  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon name="user" size={26} />
      </span>
      <h1 className="mt-6 text-2xl font-black">حساب کاربری به‌زودی فعال می‌شود</h1>
      <p className="mt-3 leading-8 text-muted">امکاناتی مثل ذخیره لیست مقایسه، هشدار تغییر قوانین پراپ‌فرم‌ها و ژورنال معاملاتی در حال آماده‌سازی است. برای اطلاع از زمان راه‌اندازی، در خبرنامه عضو شو.</p>
      <div className="mt-8 flex w-full justify-center">
        <NewsletterForm />
      </div>
      <LinkButton href="/prop-firms/" variant="ghost" className="mt-4">
        بازگشت به پراپ‌فرم‌ها
      </LinkButton>
    </div>
  );
}
