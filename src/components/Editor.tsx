import { useEffect, useRef, useState } from "react";
import type { Photo } from "../types";
import {
  Adjust,
  NEUTRAL,
  PRESETS,
  fullFilter,
  renderEdited,
  CropRect,
} from "../lib/imageEdit";
import {
  CropIcon,
  AdjustIcon,
  FiltersIcon,
  MarkupIcon,
  RotateIcon,
} from "../icons";

type EditTab = "crop" | "adjust" | "filters" | "markup";

const aspects: { key: string; label: string; r: number | null }[] = [
  { key: "free", label: "Свободно", r: null },
  { key: "square", label: "1:1", r: 1 },
  { key: "p45", label: "4:5", r: 4 / 5 },
  { key: "w169", label: "16:9", r: 16 / 9 },
];

const colors = ["#ff375f", "#ffd60a", "#30d158", "#0a84ff", "#ffffff", "#000000"];

export function Editor({
  photo,
  initialTab = "adjust",
  onCancel,
  onSave,
}: {
  photo: Photo;
  initialTab?: EditTab;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const src = photo.full || photo.thumb;
  const [tab, setTab] = useState<EditTab>(initialTab);
  const [adjust, setAdjust] = useState<Adjust>({ ...NEUTRAL });
  const [presetKey, setPresetKey] = useState("original");
  const [rotateDeg, setRotateDeg] = useState(0);
  const [aspect, setAspect] = useState("free");
  const [scale, setScale] = useState(1);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [color, setColor] = useState(colors[0]);
  const [busy, setBusy] = useState(false);

  const markupRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const presetCss = PRESETS.find((p) => p.key === presetKey)?.css ?? "";
  const previewFilter = fullFilter(adjust, presetCss);

  // Готовим слой разметки под размер изображения
  useEffect(() => {
    if (nat.w && markupRef.current) {
      markupRef.current.width = nat.w;
      markupRef.current.height = nat.h;
    }
  }, [nat]);

  const cropRect = (): CropRect | null => {
    if (!nat.w) return null;
    const imgAspect = nat.w / nat.h;
    const r = aspects.find((a) => a.key === aspect)?.r ?? null;
    if (r === null && scale >= 1) return null; // полный кадр
    const ratio = r ?? imgAspect;
    let w: number, h: number;
    if (ratio >= imgAspect) {
      w = scale;
      h = (imgAspect / ratio) * scale;
    } else {
      h = scale;
      w = (ratio / imgAspect) * scale;
    }
    const cx = Math.min(Math.max(center.x, w / 2), 1 - w / 2);
    const cy = Math.min(Math.max(center.y, h / 2), 1 - h / 2);
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  };

  const crop = cropRect();

  // ===== Разметка =====
  const drawAt = (e: React.PointerEvent) => {
    const cv = markupRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * cv.width;
    const y = ((e.clientY - rect.top) / rect.height) * cv.height;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(6, cv.width / 120);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };
  const startDraw = (e: React.PointerEvent) => {
    if (tab !== "markup") return;
    drawing.current = true;
    const ctx = markupRef.current?.getContext("2d");
    ctx?.beginPath();
    drawAt(e);
  };
  const moveDraw = (e: React.PointerEvent) => {
    if (drawing.current) drawAt(e);
  };
  const endDraw = () => {
    drawing.current = false;
  };
  const clearMarkup = () => {
    const cv = markupRef.current;
    cv?.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
  };

  // ===== Перемещение кадра =====
  const dragCrop = useRef(false);
  const onCropDown = () => {
    if (tab === "crop") dragCrop.current = true;
  };
  const onCropMove = (e: React.PointerEvent) => {
    if (!dragCrop.current || tab !== "crop") return;
    const wrap = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCenter({
      x: (e.clientX - wrap.left) / wrap.width,
      y: (e.clientY - wrap.top) / wrap.height,
    });
  };
  const onCropUp = () => {
    dragCrop.current = false;
  };

  const save = async () => {
    setBusy(true);
    try {
      const url = await renderEdited(src, {
        adjust,
        presetCss,
        rotateDeg,
        crop,
        markup: markupRef.current,
      });
      onSave(url);
    } catch {
      onCancel();
    } finally {
      setBusy(false);
    }
  };

  const tabs: { key: EditTab; Icon: typeof CropIcon }[] = [
    { key: "crop", Icon: CropIcon },
    { key: "adjust", Icon: AdjustIcon },
    { key: "filters", Icon: FiltersIcon },
    { key: "markup", Icon: MarkupIcon },
  ];

  return (
    <div className="editor">
      <header className="editor-top">
        <button className="overlay-link" onClick={onCancel}>
          Отмена
        </button>
        <button className="overlay-link strong" onClick={save} disabled={busy}>
          {busy ? "…" : "Готово"}
        </button>
      </header>

      <div
        className="editor-stage"
        onPointerMove={(e) => {
          onCropMove(e);
          moveDraw(e);
        }}
        onPointerUp={() => {
          onCropUp();
          endDraw();
        }}
        onPointerLeave={() => {
          onCropUp();
          endDraw();
        }}
      >
        <div
          className="edit-wrap"
          style={{ transform: `rotate(${rotateDeg}deg)` }}
        >
          <img
            src={src}
            alt=""
            style={{ filter: previewFilter }}
            draggable={false}
            crossOrigin="anonymous"
            onLoad={(e) => {
              const im = e.currentTarget;
              setNat({ w: im.naturalWidth, h: im.naturalHeight });
            }}
          />
          <canvas
            ref={markupRef}
            className="markup-layer"
            style={{ pointerEvents: tab === "markup" ? "auto" : "none" }}
            onPointerDown={startDraw}
          />
          {tab === "crop" && crop && (
            <div
              className="crop-frame"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`,
                height: `${crop.h * 100}%`,
              }}
              onPointerDown={onCropDown}
            />
          )}
        </div>
      </div>

      {/* Панель управления по вкладкам */}
      <div className="editor-panel">
        {tab === "crop" && (
          <div className="panel-crop">
            <div className="seg-row">
              {aspects.map((a) => (
                <button
                  key={a.key}
                  className={`chip ${aspect === a.key ? "on" : ""}`}
                  onClick={() => setAspect(a.key)}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <label className="slider-row">
              <span>Размер</span>
              <input
                type="range"
                min={0.4}
                max={1}
                step={0.01}
                value={scale}
                onChange={(e) => setScale(+e.target.value)}
              />
            </label>
            <div className="rotate-row">
              <button className="chip" onClick={() => setRotateDeg((d) => d - 90)}>
                <RotateIcon size={18} /> Влево
              </button>
              <button className="chip" onClick={() => setRotateDeg((d) => d + 90)}>
                <RotateIcon size={18} /> Вправо
              </button>
            </div>
          </div>
        )}

        {tab === "adjust" && (
          <div className="panel-adjust">
            <Slider label="Яркость" min={50} max={150} value={adjust.brightness}
              onChange={(v) => setAdjust({ ...adjust, brightness: v })} />
            <Slider label="Контраст" min={50} max={150} value={adjust.contrast}
              onChange={(v) => setAdjust({ ...adjust, contrast: v })} />
            <Slider label="Насыщенность" min={0} max={200} value={adjust.saturation}
              onChange={(v) => setAdjust({ ...adjust, saturation: v })} />
            <Slider label="Тепло" min={-100} max={100} value={adjust.warmth}
              onChange={(v) => setAdjust({ ...adjust, warmth: v })} />
          </div>
        )}

        {tab === "filters" && (
          <div className="panel-filters">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                className={`filter-chip ${presetKey === p.key ? "on" : ""}`}
                onClick={() => setPresetKey(p.key)}
              >
                <span
                  className="filter-thumb"
                  style={{ backgroundImage: `url(${photo.thumb})`, filter: p.css || "none" }}
                />
                {p.label}
              </button>
            ))}
          </div>
        )}

        {tab === "markup" && (
          <div className="panel-markup">
            <div className="color-row">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`swatch ${color === c ? "on" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <button className="chip" onClick={clearMarkup}>
              Очистить
            </button>
          </div>
        )}
      </div>

      <nav className="editor-tabs">
        {tabs.map(({ key, Icon }) => (
          <button
            key={key}
            className={`etab ${tab === key ? "on" : ""}`}
            onClick={() => setTab(key)}
          >
            <Icon size={22} />
          </button>
        ))}
      </nav>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="slider-row">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}
