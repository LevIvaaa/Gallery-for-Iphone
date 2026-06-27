export interface Photo {
  id: number;
  seed: string;
  /** Подпись/место для детального экрана */
  caption: string;
  /** Дата съёмки — для группировки по дням/месяцам */
  date: string;
  favorite: boolean;
}

const captions = [
  "Берег моря",
  "Горный перевал",
  "Утренний кофе",
  "Городские огни",
  "Лесная тропа",
  "Закат над озером",
  "Старый город",
  "Полевые цветы",
  "Зимний лес",
  "Маяк на скале",
  "Туманное утро",
  "Пустынная дорога",
];

const dates = [
  "Сегодня",
  "Вчера",
  "12 июня 2026",
  "3 мая 2026",
  "28 апреля 2026",
  "14 марта 2026",
];

// Генерируем набор тестовых фотографий.
export const photos: Photo[] = Array.from({ length: 36 }, (_, i) => ({
  id: i + 1,
  seed: `gallery-${i + 1}`,
  caption: captions[i % captions.length],
  date: dates[Math.floor(i / 6) % dates.length],
  favorite: i % 7 === 0,
}));

/** URL миниатюры (квадрат) */
export const thumbUrl = (p: Photo, size = 300) =>
  `https://picsum.photos/seed/${p.seed}/${size}/${size}`;

/** URL полноразмерного фото */
export const fullUrl = (p: Photo, w = 900, h = 1200) =>
  `https://picsum.photos/seed/${p.seed}/${w}/${h}`;

/** Группировка фото по дате (для секций в ленте) */
export function groupByDate(list: Photo[]): { date: string; items: Photo[] }[] {
  const map = new Map<string, Photo[]>();
  for (const p of list) {
    const arr = map.get(p.date) ?? [];
    arr.push(p);
    map.set(p.date, arr);
  }
  return Array.from(map, ([date, items]) => ({ date, items }));
}
