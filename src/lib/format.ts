import type { Photo } from "../types";

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatLongDate(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Короткая дата для заголовков секций: «27 июня» (без года, если этот год) */
export function formatShortDate(d: Date): string {
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(d);
}

/** Метка дня: Сегодня / Вчера / «27 июня» */
export function dayLabel(d: Date): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, now)) return "Сегодня";
  if (isSameDay(d, yesterday)) return "Вчера";
  return formatShortDate(d);
}

/**
 * Заголовок для экрана деталей (п.7):
 * Сегодня/Вчера, а если старше — город (если известен), иначе дата.
 */
export function detailTitle(p: Photo): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(p.date, now)) return "Сегодня";
  if (isSameDay(p.date, yesterday)) return "Вчера";
  return p.city || formatShortDate(p.date);
}

export function formatBytes(bytes?: number): string | undefined {
  if (!bytes) return undefined;
  const units = ["Б", "КБ", "МБ", "ГБ"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function megapixels(w?: number, h?: number): string | undefined {
  if (!w || !h) return undefined;
  return `${((w * h) / 1_000_000).toFixed(1)} Мп`;
}

/** Группировка фото по календарному дню с меткой */
export function groupByDay(list: Photo[]): { key: string; label: string; items: Photo[] }[] {
  const map = new Map<string, Photo[]>();
  for (const p of list) {
    const key = startOfDay(p.date).toISOString();
    const arr = map.get(key) ?? [];
    arr.push(p);
    map.set(key, arr);
  }
  return Array.from(map, ([key, items]) => ({
    key,
    label: dayLabel(items[0].date),
    items,
  }));
}
