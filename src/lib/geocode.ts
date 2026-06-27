// Обратный геокодинг: координаты → город. Бесплатный эндпоинт без ключа.
// Используется для реальных фото, где есть GPS, но нет названия города (п.7).
// Мягкий фолбэк: при ошибке возвращает null, UI покажет дату.

const cache = new Map<string, string | null>();

const key = (lat: number, lng: number) =>
  `${lat.toFixed(3)},${lng.toFixed(3)}`;

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  const k = key(lat, lng);
  if (cache.has(k)) return cache.get(k)!;
  try {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${lat}&longitude=${lng}&localityLanguage=ru`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const city: string | null =
      data.city || data.locality || data.principalSubdivision || null;
    cache.set(k, city);
    return city;
  } catch {
    cache.set(k, null);
    return null;
  }
}
