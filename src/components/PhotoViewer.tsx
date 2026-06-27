import { useEffect } from "react";
import { Photo, fullUrl } from "../data/photos";
import {
  ChevronLeftIcon,
  ShareIcon,
  HeartIcon,
  InfoIcon,
  TrashIcon,
} from "../icons";

export function PhotoViewer({
  photo,
  onClose,
  onToggleFavorite,
}: {
  photo: Photo;
  onClose: () => void;
  onToggleFavorite: (id: number) => void;
}) {
  // Закрытие по Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="viewer">
      <div className="viewer-bg" style={{ backgroundImage: `url(${fullUrl(photo, 60, 80)})` }} />

      <header className="viewer-top glass">
        <button className="icon-btn" onClick={onClose}>
          <ChevronLeftIcon size={26} />
          <span>Медиатека</span>
        </button>
        <div className="viewer-meta">
          <strong>{photo.caption}</strong>
          <small>{photo.date}</small>
        </div>
      </header>

      <div className="viewer-stage" onClick={onClose}>
        <img
          src={fullUrl(photo)}
          alt={photo.caption}
          className="viewer-img"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <footer className="viewer-bottom glass">
        <button className="icon-btn">
          <ShareIcon size={24} />
        </button>
        <button
          className={`icon-btn ${photo.favorite ? "active" : ""}`}
          onClick={() => onToggleFavorite(photo.id)}
        >
          <HeartIcon size={24} filled={photo.favorite} />
        </button>
        <button className="icon-btn">
          <InfoIcon size={24} />
        </button>
        <button className="icon-btn danger">
          <TrashIcon size={24} />
        </button>
      </footer>
    </div>
  );
}
