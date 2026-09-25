"use client";

import { ErrorState } from "@/components/ui/States";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24">
      <ErrorState message="در نمایش این صفحه مشکلی پیش آمد." onRetry={reset} />
    </div>
  );
}
