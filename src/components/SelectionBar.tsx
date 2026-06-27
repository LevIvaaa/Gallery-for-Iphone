import { ShareIcon, TrashIcon } from "../icons";

export function SelectionBar({
  count,
  onShare,
  onDelete,
}: {
  count: number;
  onShare: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="selection-bar glass">
      <button className="sel-btn" onClick={onShare} disabled={count === 0} aria-label="Поделиться">
        <ShareIcon size={24} />
      </button>
      <span className="sel-count">
        {count === 0 ? "Выберите фото" : `Выбрано: ${count}`}
      </span>
      <button
        className="sel-btn danger"
        onClick={onDelete}
        disabled={count === 0}
        aria-label="Удалить"
      >
        <TrashIcon size={24} />
      </button>
    </div>
  );
}
