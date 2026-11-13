"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/States";
import { isChunkError, reportClientError } from "@/lib/report-client-error";

const RELOAD_KEY = "pfm-chunk-reload";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    // After a deployment an open tab can ask for files of the old build: reload once to get the new one.
    if (isChunkError(error)) {
      try {
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          location.reload();
          return;
        }
      } catch {
        /* storage unavailable */
      }
    }
    reportClientError(error, "page");
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24">
      <ErrorState message="در نمایش این صفحه مشکلی پیش آمد." onRetry={() => (isChunkError(error) ? location.reload() : reset())} />
      <p className="latin mt-4 break-words text-center text-[11px] leading-5 text-faint" dir="ltr">
        {error.digest ? `ref: ${error.digest}` : String(error.message).slice(0, 160)}
      </p>
    </div>
  );
}
