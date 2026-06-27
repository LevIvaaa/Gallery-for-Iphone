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
  const left =
    mode === "trash" ? (
      <button className="sel-fab glass" onClick={onRestore} disabled={!count} aria-label="Восстановить">
        <UndoIcon size={22} />
      </button>
    ) : mode === "hidden" ? (
      <button className="sel-fab glass" onClick={onRestore} disabled={!count} aria-label="Убрать из скрытых">
        <EyeIcon size={22} />
      </button>
    ) : (
      <button className="sel-fab glass" onClick={onShare} disabled={!count} aria-label="Поделиться">
        <ShareIcon size={21} />
      </button>
    );

  return (
    <div className="selection-bar">
      {left}
      <div className="sel-count-pill glass">
        {count === 0 ? "Выберите фото" : `Выбрано: ${count}`}
      </div>
      <button
        className="sel-fab glass danger"
        onClick={onDelete}
        disabled={!count}
        aria-label="Удалить"
      >
        <TrashIcon size={21} />
      </button>
    </div>
  );
}
