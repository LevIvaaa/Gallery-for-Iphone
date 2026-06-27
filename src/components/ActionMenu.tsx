import type { ReactNode } from "react";

export interface ActionItem {
  key: string;
  label: string;
  icon: ReactNode;
  danger?: boolean;
}

export function ActionMenu({
  items,
  onAction,
  onClose,
}: {
  items: ActionItem[];
  onAction: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="popover-backdrop" onClick={onClose}>
      <div className="popover glass" onClick={(e) => e.stopPropagation()}>
        {items.map((it, i) => (
          <button
            key={it.key}
            className={`popover-row ${it.danger ? "danger" : ""} ${i ? "div" : ""}`}
            onClick={() => {
              onAction(it.key);
              onClose();
            }}
          >
            <span className="popover-label">{it.label}</span>
            {it.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
