import { GridIcon, CheckIcon } from "../icons";

export function CollectionsMenu({
  columns,
  onColumns,
  onCollapseAll,
  onExpandAll,
  onClose,
}: {
  columns: number;
  onColumns: (n: number) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onClose: () => void;
}) {
  const sizes = [
    { n: 2, label: "Крупно" },
    { n: 3, label: "Средне" },
    { n: 4, label: "Мелко" },
  ];
  return (
    <div className="popover-backdrop" onClick={onClose}>
      <div className="popover glass" onClick={(e) => e.stopPropagation()}>
        <div className="popover-title">Размер сетки</div>
        {sizes.map((s) => (
          <button
            key={s.n}
            className={`popover-row ${columns === s.n ? "on" : ""}`}
            onClick={() => {
              onColumns(s.n);
              onClose();
            }}
          >
            <span className="popover-label">{s.label}</span>
            {columns === s.n ? <CheckIcon size={18} /> : <GridIcon size={18} />}
          </button>
        ))}
        <div className="popover-sep" />
        <button
          className="popover-row"
          onClick={() => {
            onCollapseAll();
            onClose();
          }}
        >
          <span className="popover-label">Свернуть все</span>
        </button>
        <button
          className="popover-row"
          onClick={() => {
            onExpandAll();
            onClose();
          }}
        >
          <span className="popover-label">Развернуть все</span>
        </button>
      </div>
    </div>
  );
}
