import type { Photo } from "../types";
import {
  ShareIcon,
  CheckIcon,
  LockIcon,
  TrashIcon,
  HeartIcon,
} from "../icons";

export function ContextMenu({
  photo,
  onShare,
  onSelect,
  onFavorite,
  onHide,
  onDelete,
  onClose,
}: {
  photo: Photo;
  onShare: () => void;
  onSelect: () => void;
  onFavorite: () => void;
  onHide: () => void;
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
          {item("Выбрать", CheckIcon, onSelect)}
          {item(photo.hidden ? "Показать" : "Скрыть", LockIcon, onHide)}
          {item("Удалить", TrashIcon, onDelete, true)}
        </div>
      </div>
    </div>
  );
}
