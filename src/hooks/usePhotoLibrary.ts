import { useCallback, useEffect, useState } from "react";
import {
  isNative,
  loadDemoPhotos,
  loadNativePhotos,
} from "../services/photoLibrary";
import type { Photo, PermissionState } from "../types";

const DEMO_STATE_KEY = "gallery-demo-state";

// Веб-демо: применяем сохранённые флаги (удалено/скрыто/избранное)
function loadDemoWithState(): Photo[] {
  const base = loadDemoPhotos();
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY);
    if (!raw) return base;
    const map = JSON.parse(raw) as Record<
      string,
      { deleted?: boolean; hidden?: boolean; favorite?: boolean }
    >;
    return base.map((p) => (map[p.id] ? { ...p, ...map[p.id] } : p));
  } catch {
    return base;
  }
}

export function usePhotoLibrary() {
  const [permission, setPermission] = useState<PermissionState>(
    isNative() ? "prompt" : "demo"
  );
  const [photos, setPhotos] = useState<Photo[]>(
    isNative() ? [] : loadDemoWithState()
  );

  // Сохраняем состояние демо между сессиями
  useEffect(() => {
    if (isNative()) return;
    try {
      const map: Record<string, object> = {};
      photos.forEach((p) => {
        map[p.id] = {
          deleted: !!p.deleted,
          hidden: !!p.hidden,
          favorite: !!p.favorite,
        };
      });
      localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(map));
    } catch {
      /* недоступно */
    }
  }, [photos]);
  const [loading, setLoading] = useState(false);

  // Запросить доступ и загрузить реальные фото (на устройстве).
  const requestAndLoad = useCallback(async () => {
    if (!isNative()) {
      setPhotos(loadDemoWithState());
      setPermission("demo");
      return;
    }
    setLoading(true);
    try {
      const result = await loadNativePhotos();
      setPhotos(result);
      setPermission("granted");
    } catch {
      setPermission("denied");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );
  }, []);

  // Не удаляем сразу — помечаем как удалённое (для «Недавно удалённые»)
  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, deleted: true, deletedDate: new Date() } : p
      )
    );
  }, []);

  const restorePhoto = useCallback((id: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, deleted: false, deletedDate: undefined } : p
      )
    );
  }, []);

  // Окончательное удаление (из «Недавно удалённых»)
  const purgePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setCity = useCallback((id: string, city: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, city } : p))
    );
  }, []);

  const updatePhoto = useCallback((id: string, patch: Partial<Photo>) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }, []);

  const toggleHidden = useCallback((id: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, hidden: !p.hidden } : p))
    );
  }, []);

  return {
    permission,
    photos,
    loading,
    requestAndLoad,
    toggleFavorite,
    removePhoto,
    setCity,
    updatePhoto,
    toggleHidden,
    restorePhoto,
    purgePhoto,
  };
}
