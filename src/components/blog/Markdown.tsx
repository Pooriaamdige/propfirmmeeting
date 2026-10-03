import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Minimal, safe Markdown renderer for admin-authored articles (no raw HTML).
 * Supports: ## / ### headings, paragraphs, "- " and "1. " lists, > quotes, **bold**, [text](url).
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${keyBase}-${i++}`} className="font-bold text-fg">{m[1]}</strong>);
    else {
      const href = m[3];
      const safe = /^(https?:\/\/|\/|#|mailto:)/.test(href);
      out.push(
        safe ? (
          href.startsWith("/") ? (
            <Link key={`${keyBase}-${i++}`} href={href} className="text-accent underline-offset-4 hover:underline">{m[2]}</Link>
          ) : (
            <a key={`${keyBase}-${i++}`} href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-accent underline-offset-4 hover:underline">{m[2]}</a>
          )
        ) : (
          m[2]
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5">
      {blocks.map((block, bi) => {
        const k = `b${bi}`;
        if (block.startsWith("### ")) return <h3 key={k} className="pt-2 text-lg font-bold">{inline(block.slice(4), k)}</h3>;
        if (block.startsWith("## ")) return <h2 key={k} className="pt-4 text-xl font-bold">{inline(block.slice(3), k)}</h2>;
        const lines = block.split("\n");
        if (lines.every((l) => /^[-*] /.test(l)))
          return (
            <ul key={k} className="space-y-2.5">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-3 text-[16px] leading-8 text-fg/90">
                  <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <span>{inline(l.slice(2), `${k}-${li}`)}</span>
                </li>
              ))}
            </ul>
          );
        if (lines.every((l) => /^\d+[.)] /.test(l)))
          return (
            <ol key={k} className="list-decimal space-y-2 ps-6 text-[16px] leading-8 text-fg/90 marker:text-accent">
              {lines.map((l, li) => <li key={li}>{inline(l.replace(/^\d+[.)] /, ""), `${k}-${li}`)}</li>)}
            </ol>
          );
        if (lines.every((l) => l.startsWith("> ")))
          return <blockquote key={k} className="border-s-2 border-accent ps-4 text-[16px] leading-8 text-muted">{inline(lines.map((l) => l.slice(2)).join(" "), k)}</blockquote>;
        return <p key={k} className="text-[16.5px] leading-9 text-fg/90">{inline(lines.join(" "), k)}</p>;
      })}
    </div>
  );
}
