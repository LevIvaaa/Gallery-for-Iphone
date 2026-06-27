import { useMemo, useState } from "react";
import type { Photo } from "../types";
import { PhotoGrid } from "./PhotoGrid";
import { SearchIcon, CloseIcon } from "../icons";

export function SearchScreen({
  photos,
  onOpen,
  onClose,
}: {
  photos: Photo[];
  onOpen: (p: Photo) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return photos;
    return photos.filter((p) =>
      [p.caption, p.city, p.country].some((f) =>
        f?.toLowerCase().includes(term)
      )
    );
  }, [q, photos]);

  return (
    <div className="search-screen">
      <div className="search-top">
        <div className="search-field glass">
          <SearchIcon size={18} />
          <input
            autoFocus
            placeholder="Фото, места, моменты"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="search-clear" onClick={() => setQ("")}>
              <CloseIcon size={16} />
            </button>
          )}
        </div>
        <button className="search-cancel" onClick={onClose}>
          Отмена
        </button>
      </div>
      <div className="content search-results">
        <PhotoGrid photos={results} columns={3} onOpen={onOpen} />
      </div>
    </div>
  );
}
