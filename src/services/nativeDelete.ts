import { registerPlugin, Capacitor } from "@capacitor/core";

interface PhotoLibraryPlugin {
  deletePhotos(options: { identifiers: string[] }): Promise<{
    deleted: boolean;
    reason?: string;
  }>;
}

const PhotoLibrary = registerPlugin<PhotoLibraryPlugin>("PhotoLibrary");

/**
 * Удаляет фото из медиатеки устройства (и iCloud). На устройстве iOS
 * показывает системный диалог подтверждения Apple. Возвращает true,
 * если фото удалено; false — если пользователь отменил.
 * На вебе нативного удаления нет — возвращаем true (убираем из ленты локально).
 */
export async function deleteFromDevice(identifier?: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !identifier) return true;
  try {
    const res = await PhotoLibrary.deletePhotos({ identifiers: [identifier] });
    return !!res.deleted;
  } catch {
    return false;
  }
}

/** Массовое удаление — одно системное подтверждение Apple на все фото. */
export async function deleteManyFromDevice(identifiers: string[]): Promise<boolean> {
  const ids = identifiers.filter(Boolean);
  if (!Capacitor.isNativePlatform() || ids.length === 0) return true;
  try {
    const res = await PhotoLibrary.deletePhotos({ identifiers: ids });
    return !!res.deleted;
  } catch {
    return false;
  }
}
