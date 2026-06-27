import { ArrowLeftIcon, CropIcon, PlusIcon, TrashIcon, PersonIcon } from "../icons";

export function AvatarScreen({
  avatar,
  initials,
  onCrop,
  onReplace,
  onRemove,
  onClose,
}: {
  avatar?: string;
  initials: string;
  onCrop: () => void;
  onReplace: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <div className="avatar-screen">
      <header className="avatar-top">
        <button className="viewer-back" onClick={onClose} aria-label="Назад">
          <ArrowLeftIcon size={24} />
        </button>
      </header>

      <div className="avatar-stage">
        {avatar ? (
          <img src={avatar} alt="Фото профиля" className="avatar-big" draggable={false} />
        ) : (
          <div className="avatar-big avatar-initials">
            {initials || <PersonIcon size={80} />}
          </div>
        )}
      </div>

      <footer className="avatar-actions glass">
        <button className="av-act" onClick={onCrop} disabled={!avatar}>
          <CropIcon size={24} />
          <span>Кадрировать</span>
        </button>
        <button className="av-act" onClick={onReplace}>
          <PlusIcon size={24} />
          <span>Заменить</span>
        </button>
        <button className="av-act danger" onClick={onRemove} disabled={!avatar}>
          <TrashIcon size={24} />
          <span>Удалить</span>
        </button>
      </footer>
    </div>
  );
}
