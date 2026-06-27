import type { Photo } from "../types";
import { HeartIcon } from "../icons";

// Сплошная сетка без разбивки по датам (как «Все» в Галерее iOS).
export function PhotoGrid({
  photos,
  columns,
  onOpen,
}: {
  photos: Photo[];
  columns: number;
  onOpen: (p: Photo) => void;
}) {
  return (
    <div className="photo-grid-wrap">
      <div
        className="photo-grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {photos.map((p) => (
          <button key={p.id} className="photo-cell" onClick={() => onOpen(p)}>
            <img src={p.thumb} alt={p.caption ?? ""} loading="lazy" draggable={false} />
            {p.favorite && (
              <span className="cell-fav">
                <HeartIcon size={14} filled />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
