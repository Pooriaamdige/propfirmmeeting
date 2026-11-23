/** Normalize sentence separators in Persian copy, including content saved before this change. */
export function normalizePersianText(text: string): string {
  if (!/[\u0600-\u06ff]/.test(text)) return text;
  return text.replace(/([^\s])[ \t]+[—–-][ \t]+(?=\S)/g, "$1، ");
}

export function normalizePersianCopy<T>(value: T): T {
  if (typeof value === "string") return normalizePersianText(value) as T;
  if (Array.isArray(value)) return value.map(normalizePersianCopy) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizePersianCopy(item)])) as T;
  }
  return value;
}
