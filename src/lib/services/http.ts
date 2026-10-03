import "server-only";
import { Agent, ProxyAgent, fetch as undiciFetch, type Dispatcher } from "undici";
import { socksDispatcher } from "fetch-socks";

/**
 * Outbound HTTP for data providers.
 *
 * Set OUTBOUND_PROXY_URL to route all provider requests through a proxy:
 *   http://user:pass@host:3128   (HTTP/HTTPS proxy)
 *   socks5://user:pass@host:1080 (SOCKS5, e.g. a local v2ray/xray client at socks5://127.0.0.1:10808)
 * Needed when the server's IP is blocked by a
 * provider (Binance, Yahoo, Twelve Data and Forex Factory all geo-restrict some regions).
 */
let dispatcher: Dispatcher | null = null;
function getDispatcher(): Dispatcher {
  if (dispatcher) return dispatcher;
  const proxy = process.env.OUTBOUND_PROXY_URL;
  if (!proxy) dispatcher = new Agent({ connect: { timeout: 8000 } });
  else if (/^socks(4|5|5h)?:\/\//i.test(proxy)) {
    const u = new URL(proxy);
    dispatcher = socksDispatcher(
      { type: u.protocol.startsWith("socks4") ? 4 : 5, host: u.hostname, port: Number(u.port) || 1080, userId: decodeURIComponent(u.username) || undefined, password: decodeURIComponent(u.password) || undefined },
      { connect: { timeout: 8000 } },
    );
  } else dispatcher = new ProxyAgent({ uri: proxy, connect: { timeout: 8000 } });
  return dispatcher;
}

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export async function getJson<T>(url: string, opts: { timeoutMs?: number; headers?: Record<string, string> } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
  try {
    const res = await undiciFetch(url, {
      dispatcher: getDispatcher(),
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "application/json", ...opts.headers },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new Error(`Timeout contacting ${new URL(url).host}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
