import {
  CropIcon,
  RotateIcon,
  AdjustIcon,
  FiltersIcon,
  MarkupIcon,
  SparklesIcon,
  EraserIcon,
  ExpandIcon,
  CloseIcon,
} from "../icons";

interface EditAction {
  key: string;
  label: string;
  Icon: typeof CropIcon;
  ai?: boolean;
}

const basic: EditAction[] = [
  { key: "crop", label: "Кадрировать", Icon: CropIcon },
  { key: "rotate", label: "Повернуть", Icon: RotateIcon },
  { key: "adjust", label: "Коррекция", Icon: AdjustIcon },
  { key: "filters", label: "Фильтры", Icon: FiltersIcon },
  { key: "markup", label: "Разметка", Icon: MarkupIcon },
];

const ai: EditAction[] = [
  { key: "ai-enhance", label: "Улучшить", Icon: SparklesIcon, ai: true },
  { key: "ai-cleanup", label: "Убрать объект", Icon: EraserIcon, ai: true },
  { key: "ai-expand", label: "Расширить фон", Icon: ExpandIcon, ai: true },
  { key: "ai-denoise", label: "Убрать шум", Icon: SparklesIcon, ai: true },
];

export function EditMenu({
  onClose,
  onAction,
}: {
  onClose: () => void;
  onAction: (key: string, label: string) => void;
}) {
  const render = (a: EditAction) => (
    <button
      key={a.key}
      className={`edit-item ${a.ai ? "ai" : ""}`}
      onClick={() => onAction(a.key, a.label)}
    >
      <span className="edit-icon">
        <a.Icon size={22} />
      </span>
      <span>{a.label}</span>
    </button>
  );

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="edit-sheet glass" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <h3>Редактирование</h3>
          <button className="sheet-close" onClick={onClose} aria-label="Закрыть">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="edit-grid">{basic.map(render)}</div>

        <div className="edit-section-title">
          <SparklesIcon size={15} /> Искусственный интеллект
        </div>
        <div className="edit-grid">{ai.map(render)}</div>
      </div>
    </div>
  );
}
