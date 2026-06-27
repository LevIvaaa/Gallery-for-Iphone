import { ShareIcon, TrashIcon, UndoIcon, EyeIcon } from "../icons";

export function SelectionBar({
  count,
  mode,
  onShare,
  onRestore,
  onDelete,
}: {
  count: number;
  mode?: "trash" | "hidden";
  onShare: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="selection-bar glass">
      {mode === "trash" ? (
        <button className="sel-btn" onClick={onRestore} disabled={count === 0} aria-label="Восстановить">
          <UndoIcon size={24} />
        </button>
      ) : mode === "hidden" ? (
        <button className="sel-btn" onClick={onRestore} disabled={count === 0} aria-label="Убрать из скрытых">
          <EyeIcon size={24} />
        </button>
      ) : (
        <button className="sel-btn" onClick={onShare} disabled={count === 0} aria-label="Поделиться">
          <ShareIcon size={24} />
        </button>
      )}
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
