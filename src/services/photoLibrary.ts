import { Capacitor } from "@capacitor/core";
import type { Photo } from "../types";
import { demoPhotos } from "../data/photos";

export const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Загрузка реальных фото из медиатеки устройства (iOS).
 * Первый вызов getMedias вызывает системный запрос разрешения.
 * Фото из iCloud подтягиваются системой автоматически.
 * Бросает исключение, если доступ запрещён — наверх как "denied".
 */
export async function loadNativePhotos(quantity = 150): Promise<Photo[]> {
  const { Media } = await import("@capacitor-community/media");
  const res = await Media.getMedias({
    quantity,
    thumbnailWidth: 600,
    thumbnailHeight: 600,
    thumbnailQuality: 90,
    types: "photos",
    sort: [{ key: "creationDate", ascending: false }],
  });

  return res.medias.map((m, i): Photo => {
    const hasLoc =
      m.location &&
      typeof m.location.latitude === "number" &&
      (m.location.latitude !== 0 || m.location.longitude !== 0);
    return {
      id: m.identifier || `native-${i}`,
      identifier: m.identifier,
      thumb: m.data ? `data:image/jpeg;base64,${m.data}` : "",
      full: null, // подгружается лениво через getFullSrc
      date: m.creationDate ? new Date(m.creationDate) : new Date(),
      favorite: false,
      width: m.fullWidth,
      height: m.fullHeight,
      location: hasLoc
        ? {
            lat: m.location.latitude,
            lng: m.location.longitude,
            altitude: m.location.altitude,
          }
        : undefined,
      source: "native",
    };
  });
}

/** Путь к полноразмерному фото по идентификатору (iOS), пригодный для <img>. */
export async function getFullSrc(identifier: string): Promise<string> {
  const { Media } = await import("@capacitor-community/media");
  const { path } = await Media.getMediaByIdentifier({ identifier });
  return Capacitor.convertFileSrc(path);
}

/** Демо-данные для веба/разработки. */
export function loadDemoPhotos(): Photo[] {
  return demoPhotos;
}
