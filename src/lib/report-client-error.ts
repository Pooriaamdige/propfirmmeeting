/** Sends a browser-side crash to the server log (pm2 logs) so it can be diagnosed. Best effort. */
export function reportClientError(error: Error & { digest?: string }, where: string) {
  try {
    const body = JSON.stringify({
      where,
      message: String(error?.message ?? error).slice(0, 500),
      digest: error?.digest,
      stack: String(error?.stack ?? "").slice(0, 2000),
      url: location.href,
      ua: navigator.userAgent,
    });
    if (!navigator.sendBeacon?.("/api/client-error/", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/client-error/", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* never throw from the reporter */
  }
}

/** A chunk from a previous deployment that no longer exists: a reload fetches the new build. */
export const isChunkError = (error: unknown) => /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(String((error as Error)?.message ?? error) + String((error as Error)?.name ?? ""));
