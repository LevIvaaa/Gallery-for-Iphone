import { Capacitor } from "@capacitor/core";
import type { Photo } from "../types";

export async function sharePhoto(photo: Photo): Promise<void> {
  const url = photo.full || photo.thumb;
  const title = photo.caption || "Фото";

  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, url });
      return;
    } catch {
      /* упадём в веб-фолбэк */
    }
  }

  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
  } catch {
    /* пользователь отменил или не поддерживается */
  }

  try {
    await navigator.clipboard.writeText(url);
  } catch {
    /* no-op */
  }
}
