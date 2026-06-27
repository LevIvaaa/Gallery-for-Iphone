import type { Photo } from "../types";
import { groupByDay } from "../lib/format";
import { HeartIcon } from "../icons";

function Cell({ p, onOpen }: { p: Photo; onOpen: (p: Photo) => void }) {
  return (
    <button className="photo-cell" onClick={() => onOpen(p)}>
      <img src={p.thumb} alt={p.caption ?? ""} loading="lazy" draggable={false} />
      {p.favorite && (
        <span className="cell-fav">
          <HeartIcon size={14} filled />
        </span>
      )}
    </button>
  );
}

export function PhotoGrid({
  photos,
  columns,
  grouped,
  onOpen,
}: {
  photos: Photo[];
  columns: number;
  grouped?: boolean;
  onOpen: (p: Photo) => void;
}) {
  const cols = { gridTemplateColumns: `repeat(${columns}, 1fr)` };

  if (grouped) {
    return (
      <div className="photo-grid-wrap">
        {groupByDay(photos).map((g) => (
          <section key={g.key} className="photo-section">
            <h2 className="section-title">{g.label}</h2>
            <div className="photo-grid" style={cols}>
              {g.items.map((p) => (
                <Cell key={p.id} p={p} onOpen={onOpen} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="photo-grid-wrap">
      <div className="photo-grid" style={cols}>
        {photos.map((p) => (
          <Cell key={p.id} p={p} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
