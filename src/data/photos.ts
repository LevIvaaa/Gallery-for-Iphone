import type { Photo } from "../types";

// Тестовые данные для веб-превью (на устройстве используются реальные фото).
// Содержат богатые метаданные, чтобы продемонстрировать экран информации.

const samples: {
  caption: string;
  city?: string;
  country?: string;
  daysAgo: number;
  fav?: boolean;
  loc?: { lat: number; lng: number; altitude?: number };
  meta: Photo["meta"];
  ratio: "p" | "l"; // портрет / ландшафт
}[] = [
  { caption: "Утренний свет", daysAgo: 0, fav: true, ratio: "l",
    meta: { camera: "iPhone 11", lens: "Осн. камера — 26 мм", fileName: "IMG_4821.HEIC", fileSize: 3_540_000, iso: 32, aperture: "f/1.8", shutter: "1/120", focalLength: "26 мм" } },
  { caption: "Кофе", daysAgo: 0, ratio: "p",
    meta: { camera: "iPhone 11", lens: "Осн. камера — 26 мм", fileName: "IMG_4822.HEIC", fileSize: 2_910_000, iso: 64, aperture: "f/1.8", shutter: "1/60", focalLength: "26 мм" } },
  { caption: "Набережная", daysAgo: 0, ratio: "l",
    meta: { camera: "iPhone 11", lens: "Сверхширокая — 13 мм", fileName: "IMG_4823.HEIC", fileSize: 4_120_000, iso: 25, aperture: "f/2.4", shutter: "1/500", focalLength: "13 мм" } },
  { caption: "Вечерний город", daysAgo: 1, fav: true, ratio: "p",
    meta: { camera: "iPhone 11", lens: "Осн. камера — 26 мм", fileName: "IMG_4790.HEIC", fileSize: 3_980_000, iso: 320, aperture: "f/1.8", shutter: "1/30", focalLength: "26 мм" } },
  { caption: "Парк", daysAgo: 1, ratio: "l",
    meta: { camera: "iPhone 11", lens: "Осн. камера — 26 мм", fileName: "IMG_4791.HEIC", fileSize: 3_300_000, iso: 50, aperture: "f/1.8", shutter: "1/250", focalLength: "26 мм" } },
  { caption: "Закат у моря", city: "Барселона", country: "Испания", daysAgo: 6, fav: true, ratio: "l",
    loc: { lat: 41.3851, lng: 2.1734, altitude: 12 },
    meta: { camera: "iPhone 11", lens: "Осн. камера — 26 мм", fileName: "IMG_4501.HEIC", fileSize: 4_700_000, iso: 40, aperture: "f/1.8", shutter: "1/400", focalLength: "26 мм" } },
  { caption: "Старый квартал", city: "Барселона", country: "Испания", daysAgo: 6, ratio: "p",
    loc: { lat: 41.3833, lng: 2.1777, altitude: 18 },
    meta: { camera: "iPhone 11", lens: "Осн. камера — 26 мм", fileName: "IMG_4502.HEIC", fileSize: 3_650_000, iso: 80, aperture: "f/1.8", shutter: "1/120", focalLength: "26 мм" } },
  { caption: "Горный перевал", city: "Церматт", country: "Швейцария", daysAgo: 24, ratio: "l",
    loc: { lat: 46.0207, lng: 7.7491, altitude: 1620 },
    meta: { camera: "iPhone 11", lens: "Сверхширокая — 13 мм", fileName: "IMG_4203.HEIC", fileSize: 5_120_000, iso: 25, aperture: "f/2.4", shutter: "1/800", focalLength: "13 мм" } },
  { caption: "Туман в долине", city: "Церматт", country: "Швейцария", daysAgo: 24, fav: true, ratio: "p",
    loc: { lat: 46.0211, lng: 7.7486, altitude: 1705 },
    meta: { camera: "iPhone 11", lens: "Осн. камера — 26 мм", fileName: "IMG_4204.HEIC", fileSize: 4_010_000, iso: 50, aperture: "f/1.8", shutter: "1/300", focalLength: "26 мм" } },
  { caption: "Маяк", city: "Лиссабон", country: "Португалия", daysAgo: 52, ratio: "l",
    loc: { lat: 38.7223, lng: -9.1393, altitude: 30 },
    meta: { camera: "iPhone 11", lens: "Осн. камера — 26 мм", fileName: "IMG_3980.HEIC", fileSize: 3_870_000, iso: 32, aperture: "f/1.8", shutter: "1/600", focalLength: "26 мм" } },
  { caption: "Трамвай", city: "Лиссабон", country: "Португалия", daysAgo: 52, fav: true, ratio: "p",
    loc: { lat: 38.7139, lng: -9.1394, altitude: 45 },
    meta: { camera: "iPhone 11", lens: "Осн. камера — 26 мм", fileName: "IMG_3981.HEIC", fileSize: 3_420_000, iso: 100, aperture: "f/1.8", shutter: "1/120", focalLength: "26 мм" } },
  { caption: "Полевые цветы", city: "Прованс", country: "Франция", daysAgo: 88, ratio: "l",
    loc: { lat: 43.9352, lng: 6.0679, altitude: 320 },
    meta: { camera: "iPhone 11", lens: "Осн. камера — 26 мм", fileName: "IMG_3702.HEIC", fileSize: 4_450_000, iso: 25, aperture: "f/1.8", shutter: "1/700", focalLength: "26 мм" } },
];

const SEEDS = [
  "morning", "coffee", "promenade", "citynight", "park", "sunset-sea",
  "oldtown", "pass", "valleyfog", "lighthouse", "tram", "wildflowers",
];

// Тип медиа для демонстрации блока «Типы медиафайлов»
const KINDS: Photo["kind"][] = [
  "photo", "selfie", "photo", "video", "live", "photo",
  "screenshot", "photo", "video", "photo", "screenrec", "live",
];

function dateDaysAgo(days: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const detailed: Photo[] = samples.map((s, i) => {
  const seed = SEEDS[i];
  const portrait = s.ratio === "p";
  const w = portrait ? 2316 : 4032;
  const h = portrait ? 3088 : 3024;
  const fullW = portrait ? 900 : 1200;
  const fullH = portrait ? 1200 : 900;
  return {
    id: `demo-${i + 1}`,
    thumb: `https://picsum.photos/seed/${seed}/400/400`,
    full: `https://picsum.photos/seed/${seed}/${fullW}/${fullH}`,
    caption: s.caption,
    city: s.city,
    country: s.country,
    date: dateDaysAgo(s.daysAgo, 9 + (i % 10), (i * 7) % 60),
    addedDate: dateDaysAgo(Math.max(0, s.daysAgo - 0), 10 + (i % 8), (i * 11) % 60),
    favorite: !!s.fav,
    kind: KINDS[i],
    pinned: i === 0 || i === 5,
    durationSec:
      KINDS[i] === "video" ? 12 + i : KINDS[i] === "screenrec" ? 30 + i : undefined,
    width: w,
    height: h,
    location: s.loc,
    meta: s.meta,
    source: "demo",
  };
});

export const demoPhotos: Photo[] = detailed;
