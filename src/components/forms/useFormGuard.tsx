"use client";

import { useEffect, useRef, useState } from "react";

/** Honeypot + render timestamp for the server-side bot checks. */
export function useFormGuard() {
  const startedAt = useRef<number>(0);
  const [honeypot, setHoneypot] = useState("");
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  return {
    honeypot,
    honeypotField: (
      <div aria-hidden className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0 [clip-path:inset(50%)]">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="website" />
        </label>
      </div>
    ),
    meta: () => ({ website: honeypot, startedAt: startedAt.current || Date.now() }),
  };
}
