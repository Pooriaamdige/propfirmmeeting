import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <p className="num text-7xl font-black text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold">صفحه موردنظر پیدا نشد</h1>
      <p className="mt-3 text-muted">ممکن است آدرس تغییر کرده باشد. از جستجو (کلید /) یا لینک‌های زیر استفاده کنید.</p>
      <div className="mt-8 flex gap-3">
        <LinkButton href="/">صفحه اصلی</LinkButton>
        <LinkButton href="/prop-firms/" variant="secondary">
          پراپ‌فرم‌ها
        </LinkButton>
      </div>
    </div>
  );
}
