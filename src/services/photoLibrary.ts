import { registerPlugin, Capacitor } from "@capacitor/core";
import type { Photo } from "../types";
import { demoPhotos } from "../data/photos";

interface NativeAsset {
  id: string;
  creationDate: string;
  width: number;
  height: number;
  favorite: boolean;
  location: { lat?: number; lng?: number; altitude?: number };
}
interface PhotoLibraryPlugin {
  getAssets(o: { limit?: number }): Promise<{ assets: NativeAsset[] }>;
  getThumbnail(o: { identifier: string; size: number }): Promise<{ path: string }>;
}
const PhotoLibrary = registerPlugin<PhotoLibraryPlugin>("PhotoLibrary");

export const isNative = (): boolean => Capacitor.isNativePlatform();

// Поддерживается ли быстрый кастомный плагин (определяется при первой загрузке)
let fastAvailable = true;

/**
 * Загрузка медиатеки. Сначала быстрый кастомный плагин (только метаданные,
 * ленивые превью). Если он недоступен — фолбэк на @capacitor-community/media
 * (надёжно запрашивает доступ и отдаёт превью), чтобы доступ работал всегда.
 */
export async function loadNativePhotos(): Promise<Photo[]> {
  try {
    const { assets } = await PhotoLibrary.getAssets({ limit: 0 });
    if (assets && assets.length > 0) {
      fastAvailable = true;
      return assets.map((a, i): Photo => {
        const hasLoc = a.location && typeof a.location.lat === "number";
        return {
          id: a.id || `native-${i}`,
          identifier: a.id,
          thumb: "",
          full: null,
          date: a.creationDate ? new Date(a.creationDate) : new Date(),
          favorite: !!a.favorite,
          kind: "photo",
          width: a.width,
          height: a.height,
          location: hasLoc
            ? { lat: a.location.lat!, lng: a.location.lng!, altitude: a.location.altitude }
            : undefined,
          source: "native",
        };
      });
    }
  } catch {
    /* кастомный плагин недоступен — идём в фолбэк */
  }

  // Фолбэк: проверенный плагин (запрашивает доступ + base64-превью)
  fastAvailable = false;
  const { Media } = await import("@capacitor-community/media");
  const res = await Media.getMedias({
    quantity: 200,
    thumbnailWidth: 256,
    thumbnailHeight: 256,
    thumbnailQuality: 75,
    types: "photos",
    sort: "creationDate",
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
      full: null,
      date: m.creationDate ? new Date(m.creationDate) : new Date(),
      favorite: false,
      kind: "photo",
      width: m.fullWidth,
      height: m.fullHeight,
      location: hasLoc
        ? { lat: m.location.latitude, lng: m.location.longitude, altitude: m.location.altitude }
        : undefined,
      source: "native",
    };
  });
}

/** Ленивая миниатюра по идентификатору (только при доступном быстром плагине). */
export async function getThumbSrc(identifier: string, size = 256): Promise<string> {
  if (!fastAvailable) return "";
  try {
    const { path } = await PhotoLibrary.getThumbnail({ identifier, size });
    return path ? Capacitor.convertFileSrc(path) : "";
  } catch {
    return "";
  }
}

/** Полноразмерное фото по идентификатору. */
export async function getFullSrc(identifier: string): Promise<string> {
  if (!fastAvailable) return "";
  try {
    const { path } = await PhotoLibrary.getThumbnail({ identifier, size: 1600 });
    return path ? Capacitor.convertFileSrc(path) : "";
  } catch {
    return "";
  }
}

export function loadDemoPhotos(): Photo[] {
  return demoPhotos;
}
