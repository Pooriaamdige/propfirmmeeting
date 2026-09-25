"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const captchaEnabled = !!SITE_KEY;

/** Cloudflare Turnstile widget — rendered only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  const render = () => {
    if (!ref.current || !window.turnstile || rendered.current) return;
    rendered.current = true;
    window.turnstile.render(ref.current, { sitekey: SITE_KEY, theme: "auto", language: "fa", callback: onToken, "expired-callback": () => onToken("") });
  };

  useEffect(render);

  if (!SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="lazyOnload" onLoad={render} />
      <div ref={ref} className="min-h-[65px]" />
    </>
  );
}
