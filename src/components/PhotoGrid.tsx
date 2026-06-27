import { useRef } from "react";
import type { Photo } from "../types";
import { groupByDay } from "../lib/format";
import { HeartIcon, CheckIcon } from "../icons";

function Cell({
  p,
  selecting,
  selected,
  onOpen,
  onToggleSelect,
  onLongPress,
}: {
  p: Photo;
  selecting?: boolean;
  selected?: boolean;
  onOpen: (p: Photo) => void;
  onToggleSelect?: (p: Photo) => void;
  onLongPress?: (p: Photo) => void;
}) {
  const timer = useRef<number | undefined>(undefined);
  const longFired = useRef(false);

  const down = () => {
    longFired.current = false;
    timer.current = window.setTimeout(() => {
      longFired.current = true;
      onLongPress?.(p);
    }, 450);
  };
  const cancel = () => window.clearTimeout(timer.current);
  const click = () => {
    if (longFired.current) return;
    if (selecting) onToggleSelect?.(p);
    else onOpen(p);
  };

  return (
    <button
      className={`photo-cell ${selecting ? "selecting" : ""} ${selected ? "selected" : ""}`}
      onClick={click}
      onPointerDown={down}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerMove={cancel}
    >
      <img src={p.thumb} alt={p.caption ?? ""} loading="lazy" draggable={false} />
      {p.favorite && !selecting && (
        <span className="cell-fav">
          <HeartIcon size={14} filled />
        </span>
      )}
      {selecting && (
        <span className={`cell-check ${selected ? "on" : ""}`}>
          {selected && <CheckIcon size={14} />}
        </span>
      )}
    </button>
  );
}

export function PhotoGrid({
  photos,
  columns,
  grouped,
  selecting,
  selected,
  onOpen,
  onToggleSelect,
  onLongPress,
}: {
  photos: Photo[];
  columns: number;
  grouped?: boolean;
  selecting?: boolean;
  selected?: Set<string>;
  onOpen: (p: Photo) => void;
  onToggleSelect?: (p: Photo) => void;
  onLongPress?: (p: Photo) => void;
}) {
  const cols = { gridTemplateColumns: `repeat(${columns}, 1fr)` };
  const cell = (p: Photo) => (
    <Cell
      key={p.id}
      p={p}
      selecting={selecting}
      selected={selected?.has(p.id)}
      onOpen={onOpen}
      onToggleSelect={onToggleSelect}
      onLongPress={onLongPress}
    />
  );

  if (grouped) {
    return (
      <div className="photo-grid-wrap">
        {groupByDay(photos).map((g) => (
          <section key={g.key} className="photo-section">
            <h2 className="section-title">{g.label}</h2>
            <div className="photo-grid" style={cols}>
              {g.items.map(cell)}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="photo-grid-wrap">
      <div className="photo-grid" style={cols}>
        {photos.map(cell)}
      </div>
    </div>
  );
}
