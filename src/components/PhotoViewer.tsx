import { useEffect, useRef, useState } from "react";
import type { Photo } from "../types";
import { detailTitle, formatTime } from "../lib/format";
import { getFullSrc } from "../services/photoLibrary";
import { reverseGeocode } from "../lib/geocode";
import { haptic } from "../lib/haptics";
import { sharePhoto } from "../lib/share";
import { deleteFromDevice } from "../services/nativeDelete";
import { MetadataSheet } from "./MetadataSheet";
import { Editor } from "./Editor";
import { ArrowLeftIcon, AdjustIcon, ShareIcon, HeartIcon, TrashIcon } from "../icons";

export function PhotoViewer({
  photos,
  index,
  onIndexChange,
  onClose,
  onToggleFavorite,
  onDelete,
  onSetCity,
  onUpdatePhoto,
  onToggleHidden,
}: {
  photos: Photo[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onSetCity: (id: string, city: string) => void;
  onUpdatePhoto: (id: string, patch: Partial<Photo>) => void;
  onToggleHidden: (id: string) => void;
}) {
  const photo = photos[index];
  const [fullscreen, setFullscreen] = useState(false);
  const [fullSrc, setFullSrc] = useState<string | null>(photo.full);
  const [showMeta, setShowMeta] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Жесты
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [animating, setAnimating] = useState(false);
  const pagerRef = useRef<HTMLDivElement>(null);
  const start = useRef({ x: 0, y: 0 });
  const axis = useRef<"none" | "h" | "v">("none");
  const moved = useRef(false);
  const pendingDir = useRef(0);
  const widthRef = useRef(1);

  // Полноразмерное фото на устройстве
  useEffect(() => {
    let cancelled = false;
    setFullSrc(photo.full);
    if (!photo.full && photo.identifier) {
      getFullSrc(photo.identifier)
        .then((src) => !cancelled && setFullSrc(src))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [photo]);

  // Геокодинг города для заголовка
  useEffect(() => {
    if (photo.location && !photo.city) {
      reverseGeocode(photo.location.lat, photo.location.lng).then(
        (city) => city && onSetCity(photo.id, city)
      );
    }
  }, [photo, onSetCity]);

  // Клавиатура (десктоп)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const nav = (dir: number) => {
    const next = index + dir;
    if (next < 0 || next >= photos.length || animating) return;
    haptic("light");
    widthRef.current = pagerRef.current?.clientWidth || 1;
    pendingDir.current = dir;
    setAnimating(true);
    setDragX(dir > 0 ? -widthRef.current : widthRef.current);
  };

  const onPagerTransitionEnd = () => {
    if (!animating) return;
    if (pendingDir.current !== 0) {
      onIndexChange(index + pendingDir.current);
      pendingDir.current = 0;
    }
    setAnimating(false);
    setDragX(0);
    setDragY(0);
  };

  // ===== Жесты =====
  const onPointerDown = (e: React.PointerEvent) => {
    if (animating) return;
    start.current = { x: e.clientX, y: e.clientY };
    axis.current = "none";
    moved.current = false;
    widthRef.current = pagerRef.current?.clientWidth || 1;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (axis.current === "none" && Math.hypot(dx, dy) > 10) {
      axis.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      moved.current = true;
    }
    if (axis.current === "h") {
      let v = dx;
      if ((index === 0 && dx > 0) || (index === photos.length - 1 && dx < 0))
        v = dx * 0.3; // сопротивление на краях
      setDragX(v);
    } else if (axis.current === "v") {
      setDragY(dy);
    }
  };
  const onPointerUp = () => {
    const thr = widthRef.current * 0.22;
    if (axis.current === "h") {
      if (dragX <= -thr && index < photos.length - 1) nav(1);
      else if (dragX >= thr && index > 0) nav(-1);
      else {
        setAnimating(true);
        setDragX(0);
      }
    } else if (axis.current === "v") {
      if (dragY > 120) {
        onClose();
        return;
      }
      if (dragY < -90) setShowMeta(true);
      setAnimating(true);
      setDragY(0);
    }
    axis.current = "none";
  };

  const onImageClick = () => {
    if (moved.current) {
      moved.current = false;
      return;
    }
    setFullscreen((v) => !v);
  };

  const handleShare = () => {
    haptic("light");
    sharePhoto({ ...photo, full: fullSrc ?? photo.full }).catch(() => {});
  };
  const handleFavorite = () => {
    haptic("medium");
    onToggleFavorite(photo.id);
  };
  const handleDelete = async () => {
    haptic("heavy");
    const id = photo.id;
    const ok = await deleteFromDevice(photo.identifier);
    if (!ok) return;
    const isLast = photos.length <= 1;
    if (index >= photos.length - 1 && index > 0) onIndexChange(index - 1);
    onDelete(id);
    if (isLast) onClose();
  };

  // Окно из трёх слайдов для пейджера
  const slides = [index - 1, index, index + 1];
  const dim = Math.min(Math.abs(dragY) / 800, 0.55);

  return (
    <div
      className={`viewer ${fullscreen ? "fs" : ""}`}
      style={{ background: `rgba(0,0,0,${fullscreen ? 1 : 1 - dim})` }}
    >
      {!fullscreen && (
        <div
          className="viewer-bg"
          style={{ backgroundImage: `url(${photo.thumb})`, opacity: 1 - dim }}
        />
      )}

      {!fullscreen && (
        <header className="viewer-top glass">
          <button className="viewer-back" onClick={onClose} aria-label="Назад">
            <ArrowLeftIcon size={22} />
          </button>
          <div className="viewer-title">
            <strong>{detailTitle(photo)}</strong>
            <small>{formatTime(photo.date)}</small>
          </div>
          <div className="viewer-top-spacer" />
        </header>
      )}

      <div
        className="pager"
        ref={pagerRef}
        style={{
          transform: `translateX(calc(-100% + ${dragX}px))`,
          transition: animating ? "transform 0.32s cubic-bezier(0.22,1,0.36,1)" : "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTransitionEnd={onPagerTransitionEnd}
      >
        {slides.map((si, k) => {
          const p = photos[si];
          const isCurrent = k === 1;
          return (
            <div className="slide" key={si}>
              {p && (
                <img
                  src={isCurrent ? fullSrc ?? p.thumb : p.thumb}
                  alt={p.caption ?? ""}
                  className="viewer-img"
                  draggable={false}
                  style={
                    isCurrent && axis.current === "v"
                      ? {
                          transform: `translateY(${dragY}px) scale(${Math.max(
                            0.85,
                            1 - Math.abs(dragY) / 1200
                          )})`,
                        }
                      : undefined
                  }
                  onClick={isCurrent ? onImageClick : undefined}
                />
              )}
            </div>
          );
        })}
      </div>

      {!fullscreen && (
        <footer className="viewer-bottom glass">
          <button className="vbtn" onClick={() => setShowEditor(true)} aria-label="Редактировать">
            <AdjustIcon size={22} />
          </button>
          <button className="vbtn" onClick={handleShare} aria-label="Поделиться">
            <ShareIcon size={21} />
          </button>
          <button
            className={`vbtn ${photo.favorite ? "active" : ""}`}
            onClick={handleFavorite}
            aria-label="В избранное"
          >
            <HeartIcon size={21} filled={photo.favorite} />
          </button>
          <button className="vbtn danger" onClick={handleDelete} aria-label="Удалить">
            <TrashIcon size={21} />
          </button>
        </footer>
      )}

      {showMeta && (
        <MetadataSheet
          photo={photo}
          hidden={photo.hidden}
          onToggleHidden={() => onToggleHidden(photo.id)}
          onClose={() => setShowMeta(false)}
        />
      )}
      {showEditor && (
        <Editor
          photo={{ ...photo, full: fullSrc ?? photo.full }}
          onCancel={() => setShowEditor(false)}
          onSave={(url) => {
            onUpdatePhoto(photo.id, { thumb: url, full: url });
            setShowEditor(false);
          }}
        />
      )}
    </div>
  );
}
