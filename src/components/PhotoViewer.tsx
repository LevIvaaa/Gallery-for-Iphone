import { useEffect, useRef, useState } from "react";
import type { Photo } from "../types";
import { detailTitle, formatTime } from "../lib/format";
import { getFullSrc } from "../services/photoLibrary";
import { reverseGeocode } from "../lib/geocode";
import { haptic } from "../lib/haptics";
import { sharePhoto } from "../lib/share";
import { autoEnhance, denoise } from "../lib/imageEdit";
import { removeBackground } from "../services/ai";
import { deleteFromDevice } from "../services/nativeDelete";
import { MetadataSheet } from "./MetadataSheet";
import { EditMenu } from "./EditMenu";
import { Editor } from "./Editor";
import {
  ArrowLeftIcon,
  DotsIcon,
  ShareIcon,
  HeartIcon,
  InfoIcon,
  TrashIcon,
} from "../icons";

const SWIPE = 70; // порог жеста, px

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
  const [imgSrc, setImgSrc] = useState<string>(photo.full || photo.thumb);
  const [showMeta, setShowMeta] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editorTab, setEditorTab] = useState<
    "crop" | "adjust" | "filters" | "markup" | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });

  const start = useRef({ x: 0, y: 0 });
  const axis = useRef<"none" | "h" | "v">("none");
  const moved = useRef(false);

  // Полноразмерное фото (на устройстве — лениво по идентификатору)
  useEffect(() => {
    let cancelled = false;
    setImgSrc(photo.full || photo.thumb);
    if (!photo.full && photo.identifier) {
      getFullSrc(photo.identifier)
        .then((src) => !cancelled && setImgSrc(src))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [photo]);

  // Геокодинг города для заголовка (п.7), если есть координаты, но нет города
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
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  };

  const go = (dir: number) => {
    const next = index + dir;
    if (next < 0 || next >= photos.length) return;
    haptic("light");
    onIndexChange(next);
  };

  // ===== Жесты (п.9, п.11) =====
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    axis.current = "none";
    moved.current = false;
    setDrag({ x: 0, y: 0, active: true });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    if (axis.current === "none" && Math.hypot(dx, dy) > 10) {
      axis.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      moved.current = true;
    }
    if (axis.current === "v") {
      setDrag({ x: 0, y: dy, active: true });
    } else if (axis.current === "h") {
      setDrag({ x: dx * 0.4, y: 0, active: true });
    }
  };

  const onTouchEnd = () => {
    const { x, y } = drag;
    setDrag({ x: 0, y: 0, active: false });

    if (axis.current === "v") {
      if (y > 110) return onClose(); // свайп вниз — закрыть
      if (y < -90) return setShowMeta(true); // свайп вверх — метаданные
    } else if (axis.current === "h") {
      if (x < -SWIPE * 0.4) return go(1);
      if (x > SWIPE * 0.4) return go(-1);
    }
  };

  const onImageClick = () => {
    if (moved.current) {
      moved.current = false;
      return;
    }
    setFullscreen((v) => !v); // тап — на весь экран (п.8)
  };

  const handleShare = () => {
    haptic("light");
    sharePhoto(photo).catch(() => {});
  };

  const handleFavorite = () => {
    haptic("medium");
    onToggleFavorite(photo.id);
  };

  const handleDelete = async () => {
    haptic("heavy");
    const id = photo.id;
    const ident = photo.identifier;
    // На устройстве — реальное удаление с системным подтверждением Apple
    const ok = await deleteFromDevice(ident);
    if (!ok) return; // пользователь нажал «Запретить»
    const isLast = photos.length <= 1;
    if (index >= photos.length - 1 && index > 0) onIndexChange(index - 1);
    onDelete(id);
    if (isLast) onClose();
  };

  const editTabs: Record<string, "crop" | "adjust" | "filters" | "markup"> = {
    crop: "crop",
    rotate: "crop",
    adjust: "adjust",
    filters: "filters",
    markup: "markup",
  };

  const runAI = async (key: string, label: string) => {
    try {
      let url: string;
      if (key === "ai-enhance") {
        setToast("Улучшаю…");
        url = await autoEnhance(imgSrc);
      } else if (key === "ai-denoise") {
        setToast("Убираю шум…");
        url = await denoise(imgSrc);
      } else if (key === "ai-removebg") {
        setToast("Загрузка ИИ-модели…");
        url = await removeBackground(imgSrc, (p) => {
          if (p?.progress) setToast(`Обработка… ${Math.round(p.progress)}%`);
        });
      } else {
        flash(`«${label}» — нужна генеративная модель (скоро)`);
        return;
      }
      onUpdatePhoto(photo.id, { thumb: url, full: url });
      flash("Готово");
    } catch {
      flash("Не удалось обработать");
    }
  };

  const handleEditAction = (key: string, label: string) => {
    setShowEdit(false);
    if (key.startsWith("ai-")) {
      runAI(key, label);
      return;
    }
    if (key === "hide") {
      haptic("light");
      onToggleHidden(photo.id);
      flash(photo.hidden ? "Показано" : "Скрыто");
      return;
    }
    const t = editTabs[key];
    if (t) setEditorTab(t);
  };

  const dragStyle = drag.active
    ? { transform: `translate(${drag.x}px, ${drag.y}px)` }
    : undefined;
  const bgDim = Math.min(0.001 * Math.abs(drag.y), 0.4);

  return (
    <div className={`viewer ${fullscreen ? "fs" : ""}`} data-fullscreen={fullscreen}>
      <div
        className="viewer-bg"
        style={{
          backgroundImage: fullscreen ? "none" : `url(${photo.thumb})`,
          opacity: 1 - bgDim,
        }}
      />

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
        className={`viewer-stage ${drag.active ? "dragging" : ""}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          key={photo.id}
          src={imgSrc}
          alt={photo.caption ?? ""}
          className="viewer-img"
          style={dragStyle}
          draggable={false}
          onClick={onImageClick}
        />
      </div>

      {!fullscreen && (
        <footer className="viewer-bottom glass">
          <button className="vbtn" onClick={() => setShowEdit(true)} aria-label="Редактировать">
            <DotsIcon size={22} />
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
          <button className="vbtn" onClick={() => setShowMeta(true)} aria-label="Информация">
            <InfoIcon size={21} />
          </button>
          <button className="vbtn danger" onClick={handleDelete} aria-label="Удалить">
            <TrashIcon size={21} />
          </button>
        </footer>
      )}

      {toast && <div className="toast glass">{toast}</div>}

      {showMeta && (
        <MetadataSheet photo={photo} onClose={() => setShowMeta(false)} />
      )}
      {showEdit && (
        <EditMenu
          onClose={() => setShowEdit(false)}
          onAction={handleEditAction}
          hidden={photo.hidden}
        />
      )}
      {editorTab && (
        <Editor
          photo={photo}
          initialTab={editorTab}
          onCancel={() => setEditorTab(null)}
          onSave={(url) => {
            onUpdatePhoto(photo.id, { thumb: url, full: url });
            setEditorTab(null);
            flash("Сохранено");
          }}
        />
      )}
    </div>
  );
}
