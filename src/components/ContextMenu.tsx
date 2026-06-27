import type { Photo } from "../types";
import {
  ShareIcon,
  CheckIcon,
  LockIcon,
  TrashIcon,
  HeartIcon,
  CopyIcon,
  AlbumsIcon,
  ClockIcon,
  MapPinIcon,
} from "../icons";

export function ContextMenu({
  photo,
  onShare,
  onFavorite,
  onCopy,
  onSelect,
  onHide,
  onAddAlbum,
  onEditDate,
  onEditGeo,
  onDelete,
  onClose,
}: {
  photo: Photo;
  onShare: () => void;
  onFavorite: () => void;
  onCopy: () => void;
  onSelect: () => void;
  onHide: () => void;
  onAddAlbum: () => void;
  onEditDate: () => void;
  onEditGeo: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const item = (
    label: string,
    Icon: typeof ShareIcon,
    onClick: () => void,
    danger?: boolean
  ) => (
    <button
      className={`ctx-item ${danger ? "danger" : ""}`}
      onClick={() => {
        onClick();
        onClose();
      }}
    >
      <span>{label}</span>
      <Icon size={20} />
    </button>
  );

  return (
    <div className="ctx-backdrop" onClick={onClose}>
      <div className="ctx-wrap" onClick={(e) => e.stopPropagation()}>
        <img className="ctx-preview" src={photo.full || photo.thumb} alt="" draggable={false} />
        <div className="ctx-menu glass">
          {item("Поделиться", ShareIcon, onShare)}
          {item(photo.favorite ? "Убрать из избранного" : "В избранное", HeartIcon, onFavorite)}
          {item("Скопировать", CopyIcon, onCopy)}
          {item("Выбрать", CheckIcon, onSelect)}
          {item(photo.hidden ? "Показать" : "Скрыть", LockIcon, onHide)}
          {item("Добавить в альбом", AlbumsIcon, onAddAlbum)}
          {item("Изменить дату и время", ClockIcon, onEditDate)}
          {item("Изменить геопозицию", MapPinIcon, onEditGeo)}
          {item("Удалить", TrashIcon, onDelete, true)}
        </div>
      </div>
    </div>
  );
}
