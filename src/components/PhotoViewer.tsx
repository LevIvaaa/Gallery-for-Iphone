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
import { ConfirmSheet } from "./ConfirmSheet";
import { ActionMenu } from "./ActionMenu";
import {
  ArrowLeftIcon,
  AdjustIcon,
  ShareIcon,
  HeartIcon,
  TrashIcon,
  DotsIcon,
  CopyIcon,
  LockIcon,
  AlbumsIcon,
} from "../icons";

export function PhotoViewer({
  photos,
  index,
  showMaps,
  onIndexChange,
  onClose,
  onToggleFavorite,
  onDelete,
  onSetCity,
  onUpdatePhoto,
  onAction,
}: {
  photos: Photo[];
  index: number;
  showMaps?: boolean;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onSetCity: (id: string, city: string) => void;
  onUpdatePhoto: (id: string, patch: Partial<Photo>) => void;
  onAction: (kind: string, photo: Photo) => void;
}) {
  const photo = photos[index];
  const [fullscreen, setFullscreen] = useState(false);
  const [fullSrc, setFullSrc] = useState<string | null>(photo.full);
  const [showMeta, setShowMeta] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [confirm, setConfirm] = useState<null | "delete">(null);
  const [showMenu, setShowMenu] = useState(false);
  const [closing, setClosing] = useState(false);

  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);
  const pagerRef = useRef<HTMLDivElement>(null);
  const start = useRef({ x: 0, y: 0 });
  const axis = useRef<"none" | "h" | "v">("none");
  const moved = useRef(false);
  const pendingDir = useRef(0);
  const widthRef = useRef(1);

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

  useEffect(() => {
    if (photo.location && !photo.city) {
      reverseGeocode(photo.location.lat, photo.location.lng).then(
        (city) => city && onSetCity(photo.id, city)
      );
    }
  }, [photo, onSetCity]);

  const close = () => {
    setClosing(true);
    haptic("light");
    window.setTimeout(onClose, 180);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
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
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (axis.current === "none" && Math.hypot(dx, dy) > 10) {
      axis.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      moved.current = true;
    }
    if (axis.current === "h") {
      let v = dx;
      if ((index === 0 && dx > 0) || (index === photos.length - 1 && dx < 0))
        v = dx * 0.3;
      setDragX(v);
    }
    // вертикаль: фото не двигаем (без рывка), решаем на отпускании
  };
  const onPointerUp = () => {
    if (axis.current === "h") {
      const thr = widthRef.current * 0.22;
      if (dragX <= -thr && index < photos.length - 1) nav(1);
      else if (dragX >= thr && index > 0) nav(-1);
      else {
        setAnimating(true);
        setDragX(0);
      }
    }
    axis.current = "none";
  };
  // Итог жеста: вертикаль (вверх=закрыть, вниз=детали) или горизонталь
  const onPointerUpFull = (e: React.PointerEvent) => {
    const dy = e.clientY - start.current.y;
    const dx = e.clientX - start.current.x;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 60) {
      if (dy > 0) close(); // свайп вниз — закрыть
      else setShowMeta(true); // свайп вверх — детали
      axis.current = "none";
      return;
    }
    onPointerUp();
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

  const doDelete = async () => {
    setConfirm(null);
    haptic("heavy");
    const id = photo.id;
    const ok = await deleteFromDevice(photo.identifier);
    if (!ok) return;
    const isLast = photos.length <= 1;
    if (index >= photos.length - 1 && index > 0) onIndexChange(index - 1);
    onDelete(id);
    if (isLast) onClose();
  };
  const menuItems = [
    { key: "copy", label: "Скопировать", icon: <CopyIcon size={20} /> },
    {
      key: "hide",
      label: photo.hidden ? "Показать" : "Скрыть",
      icon: <LockIcon size={20} />,
    },
    { key: "album", label: "Добавить в альбом", icon: <AlbumsIcon size={20} /> },
  ];

  const slides = [index - 1, index, index + 1];

  return (
    <div className={`viewer ${fullscreen ? "fs" : ""} ${closing ? "closing" : ""}`}>
      {!fullscreen && (
        <header className="viewer-top">
          <button className="viewer-back glass" onClick={close} aria-label="Назад">
            <ArrowLeftIcon size={22} />
          </button>
          <div className="viewer-title glass">
            <strong>{detailTitle(photo)}</strong>
            <small>{formatTime(photo.date)}</small>
          </div>
          <button className="viewer-back glass" onClick={() => setShowMenu(true)} aria-label="Ещё">
            <DotsIcon size={22} />
          </button>
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
        onPointerUp={onPointerUpFull}
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
                  src={isCurrent ? fullSrc ?? p.thumb : p.full ?? p.thumb}
                  alt={p.caption ?? ""}
                  className="viewer-img"
                  draggable={false}
                  onClick={isCurrent ? onImageClick : undefined}
                />
              )}
            </div>
          );
        })}
      </div>

      {!fullscreen && (
        <footer className="viewer-bottom-row">
          <button className="vfab glass" onClick={handleShare} aria-label="Поделиться">
            <ShareIcon size={22} />
          </button>
          <div className="vcenter glass">
            <button className="vbtn" onClick={() => setShowEditor(true)} aria-label="Редактировать">
              <AdjustIcon size={22} />
            </button>
            <button
              className={`vbtn ${photo.favorite ? "active" : ""}`}
              onClick={handleFavorite}
              aria-label="В избранное"
            >
              <HeartIcon size={22} filled={photo.favorite} />
            </button>
          </div>
          <button className="vfab glass danger" onClick={() => setConfirm("delete")} aria-label="Удалить">
            <TrashIcon size={22} />
          </button>
        </footer>
      )}

      {showMeta && (
        <MetadataSheet
          photo={photo}
          showMaps={showMaps}
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
      {confirm === "delete" && (
        <ConfirmSheet
          title="Удалить фото?"
          message="Фото будет удалено с устройства и из iCloud."
          confirmLabel="Удалить"
          destructive
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      {showMenu && (
        <ActionMenu
          items={menuItems}
          onAction={(kind) => onAction(kind, photo)}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
