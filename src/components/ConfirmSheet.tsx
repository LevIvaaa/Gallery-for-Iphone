// iOS-стиль подтверждения действия (удалить/скрыть и т.п.)
export function ConfirmSheet({
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="confirm-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-card glass">
          <div className="confirm-text">
            <strong>{title}</strong>
            {message && <span>{message}</span>}
          </div>
          <button
            className={`confirm-action ${destructive ? "danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
        <button className="confirm-cancel glass" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
