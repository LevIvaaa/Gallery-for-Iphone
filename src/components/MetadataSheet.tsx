import type { Photo } from "../types";
import {
  formatLongDate,
  formatTime,
  formatBytes,
  megapixels,
} from "../lib/format";
import { CloseIcon, MapPinIcon, LockIcon } from "../icons";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="meta-row">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  );
}

export function MetadataSheet({
  photo,
  hidden,
  showMaps = true,
  onToggleHidden,
  onClose,
}: {
  photo: Photo;
  hidden?: boolean;
  showMaps?: boolean;
  onToggleHidden?: () => void;
  onClose: () => void;
}) {
  const m = photo.meta;
  const dims =
    photo.width && photo.height
      ? `${photo.width} × ${photo.height}`
      : undefined;
  const exposure = [m?.aperture, m?.shutter, m?.iso ? `ISO ${m.iso}` : undefined]
    .filter(Boolean)
    .join(" · ");
  const loc = photo.location;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="meta-sheet glass" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <h3>{photo.caption || "Информация"}</h3>
          <button className="sheet-close" onClick={onClose} aria-label="Закрыть">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="meta-list">
          <Row label="Дата" value={formatLongDate(photo.date)} />
          <Row label="Время" value={formatTime(photo.date)} />
          {photo.addedDate && (
            <Row label="Добавлено" value={formatLongDate(photo.addedDate)} />
          )}
          <div className="meta-divider" />
          <Row label="Имя файла" value={m?.fileName} />
          <Row label="Размер" value={formatBytes(m?.fileSize)} />
          <Row label="Разрешение" value={dims} />
          <Row label="Мегапиксели" value={megapixels(photo.width, photo.height)} />
          <div className="meta-divider" />
          <Row label="Камера" value={m?.camera} />
          <Row label="Объектив" value={m?.lens} />
          <Row label="Фокусное" value={m?.focalLength} />
          <Row label="Экспозиция" value={exposure || undefined} />

          {loc && (
            <>
              <div className="meta-divider" />
              <Row label="Город" value={photo.city} />
              <Row
                label="Координаты"
                value={`${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`}
              />
              {typeof loc.altitude === "number" && (
                <Row label="Высота" value={`${Math.round(loc.altitude)} м`} />
              )}
              {showMaps && (
              <a
                className="meta-map"
                href={`https://maps.apple.com/?ll=${loc.lat},${loc.lng}&q=${encodeURIComponent(
                  photo.city || photo.caption || "Фото"
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPinIcon size={18} />
                Открыть на карте
              </a>
              )}
            </>
          )}

          {onToggleHidden && (
            <button className="meta-action" onClick={onToggleHidden}>
              <LockIcon size={18} />
              {hidden ? "Показать фото" : "Скрыть фото"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
