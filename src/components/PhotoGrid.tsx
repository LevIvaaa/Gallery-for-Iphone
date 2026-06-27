import { Photo, thumbUrl, groupByDate } from "../data/photos";
import { HeartIcon } from "../icons";

export function PhotoGrid({
  photos,
  columns,
  onOpen,
}: {
  photos: Photo[];
  columns: number;
  onOpen: (p: Photo) => void;
}) {
  const groups = groupByDate(photos);

  return (
    <div className="photo-grid-wrap">
      {groups.map((group) => (
        <section key={group.date} className="photo-section">
          <h2 className="section-title">{group.date}</h2>
          <div
            className="photo-grid"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {group.items.map((p) => (
              <button key={p.id} className="photo-cell" onClick={() => onOpen(p)}>
                <img
                  src={thumbUrl(p)}
                  alt={p.caption}
                  loading="lazy"
                  draggable={false}
                />
                {p.favorite && (
                  <span className="cell-fav">
                    <HeartIcon size={14} filled />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
