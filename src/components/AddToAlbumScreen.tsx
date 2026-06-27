import { useState } from "react";
import type { Photo } from "../types";
import { CheckIcon } from "../icons";

export function AddToAlbumScreen({
  photos,
  onCancel,
  onCreate,
}: {
  photos: Photo[];
  onCancel: () => void;
  onCreate: (name: string, ids: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const canCreate = name.trim().length > 0;

  return (
    <div className="screen-overlay">
      <header className="overlay-top glass">
        <button className="overlay-link" onClick={onCancel}>
          Отмена
        </button>
        <strong>Новый альбом</strong>
        <button
          className="overlay-link strong"
          disabled={!canCreate}
          onClick={() => onCreate(name.trim(), Array.from(selected))}
        >
          Создать
        </button>
      </header>

      <div className="overlay-body">
        <input
          className="album-name-input glass"
          placeholder="Название альбома"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <p className="overlay-hint">
          Выберите фото для альбома{selected.size ? ` · ${selected.size}` : ""}
        </p>
        <div className="select-grid">
          {photos.map((p) => {
            const on = selected.has(p.id);
            return (
              <button
                key={p.id}
                className={`select-cell ${on ? "on" : ""}`}
                onClick={() => toggle(p.id)}
              >
                <img src={p.thumb} alt="" draggable={false} />
                <span className="select-mark">{on && <CheckIcon size={14} />}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
