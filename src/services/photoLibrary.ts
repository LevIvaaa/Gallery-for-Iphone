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

/**
 * Быстрый список всех фото из медиатеки (только метаданные, без пикселей).
 * Миниатюры подгружаются лениво через getThumbSrc — как в нативной галерее.
 */
export async function loadNativePhotos(): Promise<Photo[]> {
  const { assets } = await PhotoLibrary.getAssets({ limit: 0 });
  return assets.map((a, i): Photo => {
    const hasLoc = a.location && typeof a.location.lat === "number";
    return {
      id: a.id || `native-${i}`,
      identifier: a.id,
      thumb: "", // лениво
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

/** Ленивая миниатюра по идентификатору (файл из системного кэша). */
export async function getThumbSrc(identifier: string, size = 256): Promise<string> {
  const { path } = await PhotoLibrary.getThumbnail({ identifier, size });
  return path ? Capacitor.convertFileSrc(path) : "";
}

/** Полноразмерное фото по идентификатору. */
export async function getFullSrc(identifier: string): Promise<string> {
  const { path } = await PhotoLibrary.getThumbnail({ identifier, size: 1600 });
  return path ? Capacitor.convertFileSrc(path) : "";
}

export function loadDemoPhotos(): Photo[] {
  return demoPhotos;
}
