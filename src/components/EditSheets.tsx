import { useState } from "react";
import type { Photo, UserAlbum } from "../types";
import { PlusIcon, AlbumsIcon } from "../icons";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function DateEditSheet({
  photo,
  onSave,
  onClose,
}: {
  photo: Photo;
  onSave: (d: Date) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(toLocalInput(photo.date));
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="edit-mini glass" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <h3 className="mini-title">Дата и время</h3>
        <input
          className="mini-input glass"
          type="datetime-local"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <div className="mini-actions">
          <button className="mini-btn" onClick={onClose}>
            Отмена
          </button>
          <button
            className="mini-btn primary"
            onClick={() => {
              const d = new Date(val);
              if (!isNaN(d.getTime())) onSave(d);
              onClose();
            }}
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

export function GeoEditSheet({
  photo,
  onSave,
  onClose,
}: {
  photo: Photo;
  onSave: (city: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(photo.city ?? "");
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="edit-mini glass" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <h3 className="mini-title">Геопозиция</h3>
        <input
          className="mini-input glass"
          type="text"
          placeholder="Город / место"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <div className="mini-actions">
          <button className="mini-btn" onClick={onClose}>
            Отмена
          </button>
          <button
            className="mini-btn primary"
            onClick={() => {
              onSave(val.trim());
              onClose();
            }}
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlbumPickerSheet({
  albums,
  onPick,
  onCreate,
  onClose,
}: {
  albums: UserAlbum[];
  onPick: (albumId: string) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="settings-sheet glass" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <h3>Добавить в альбом</h3>
        </div>
        <div className="settings-group glass-row">
          <button
            className="settings-row"
            onClick={() => {
              onCreate();
              onClose();
            }}
          >
            <span className="list-ico accent">
              <PlusIcon size={20} />
            </span>
            <span style={{ flex: 1, textAlign: "left", marginLeft: 12 }}>
              Новый альбом
            </span>
          </button>
          {albums.map((al) => (
            <button
              key={al.id}
              className="settings-row div"
              onClick={() => {
                onPick(al.id);
                onClose();
              }}
            >
              <span className="list-ico">
                <AlbumsIcon size={20} />
              </span>
              <span style={{ flex: 1, textAlign: "left", marginLeft: 12 }}>
                {al.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
