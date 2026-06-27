import { useEffect, useRef, useState } from "react";
import type { Photo } from "../types";
import {
  Adjust,
  NEUTRAL,
  TOOLS,
  PRESETS,
  buildFilter,
  renderEdited,
  CropRect,
  autoEnhance,
  denoise,
} from "../lib/imageEdit";
import { removeBackground } from "../services/ai";
import {
  UndoIcon,
  RedoIcon,
  MarkupIcon,
  RotateCwIcon,
  FlipHIcon,
  SparklesIcon,
  EraserIcon,
  CheckIcon,
} from "../icons";

type Tab = "adjust" | "filters" | "crop" | "ai";
type CropMode = "move" | "tl" | "tr" | "bl" | "br" | null;

interface ES {
  adjust: Adjust;
  preset: string;
  rotate: number;
  flipH: boolean;
  flipV: boolean;
  aspect: string;
  crop: CropRect;
}

const FULL: CropRect = { x: 0, y: 0, w: 1, h: 1 };
const INIT: ES = {
  adjust: { ...NEUTRAL },
  preset: "original",
  rotate: 0,
  flipH: false,
  flipV: false,
  aspect: "free",
  crop: { ...FULL },
};

const aspects = [
  { key: "free", label: "Свободно", r: null as number | null },
  { key: "square", label: "1:1", r: 1 },
  { key: "p45", label: "4:5", r: 4 / 5 },
  { key: "w169", label: "16:9", r: 16 / 9 },
];
const colors = ["#ff375f", "#ffd60a", "#30d158", "#0a84ff", "#ffffff", "#000000"];
const clamp = (n: number, a: number, b: number) => Math.min(Math.max(n, a), b);
const MIN = 0.15;

export function Editor({
  photo,
  onCancel,
  onSave,
}: {
  photo: Photo;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const [workingSrc, setWorkingSrc] = useState(photo.full || photo.thumb);
  const [hist, setHist] = useState<ES[]>([INIT]);
  const [hi, setHi] = useState(0);
  const [draft, setDraft] = useState<ES>(INIT);
  const [tab, setTab] = useState<Tab>("adjust");
  const [tool, setTool] = useState<keyof Adjust>("exposure");
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [markupMode, setMarkupMode] = useState(false);
  const [color, setColor] = useState(colors[0]);
  const [busy, setBusy] = useState("");

  const markupRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const cropDrag = useRef<{ mode: CropMode; lx: number; ly: number }>({
    mode: null,
    lx: 0,
    ly: 0,
  });
  const pinch = useRef<{ d: number; rect: CropRect } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const presetCss = PRESETS.find((p) => p.key === draft.preset)?.css ?? "";
  const previewFilter = buildFilter(draft.adjust, presetCss);

  useEffect(() => {
    if (nat.w && markupRef.current) {
      markupRef.current.width = nat.w;
      markupRef.current.height = nat.h;
    }
  }, [nat]);

  const commit = (next: ES) => {
    setHist((h) => [...h.slice(0, hi + 1), next]);
    setHi((i) => i + 1);
    setDraft(next);
  };
  const undo = () => hi > 0 && (setHi(hi - 1), setDraft(hist[hi - 1]));
  const redo = () =>
    hi < hist.length - 1 && (setHi(hi + 1), setDraft(hist[hi + 1]));

  const isFull =
    draft.crop.x <= 0.001 &&
    draft.crop.y <= 0.001 &&
    draft.crop.w >= 0.999 &&
    draft.crop.h >= 0.999;
  const renderCrop = isFull ? null : draft.crop;

  const setAspect = (key: string) => {
    const r = aspects.find((a) => a.key === key)?.r ?? null;
    let rect: CropRect;
    if (r === null || !nat.w) rect = { ...FULL };
    else {
      const ia = nat.w / nat.h;
      let w: number, h: number;
      if (r >= ia) {
        w = 1;
        h = ia / r;
      } else {
        h = 1;
        w = r / ia;
      }
      rect = { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
    }
    commit({ ...draft, aspect: key, crop: rect });
  };

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
    ctx.lineWidth = Math.max(6, cv.width / 110);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  // ===== Кадрирование: перетаскивание/маркеры =====
  const cropPointerDown = (e: React.PointerEvent, mode: CropMode) => {
    e.stopPropagation();
    cropDrag.current = { mode, lx: e.clientX, ly: e.clientY };
  };

  const onStagePointerDown = (e: React.PointerEvent) => {
    if (markupMode) {
      drawing.current = true;
      markupRef.current?.getContext("2d")?.beginPath();
      drawAt(e);
    }
  };
  const onStagePointerMove = (e: React.PointerEvent) => {
    if (drawing.current) {
      drawAt(e);
      return;
    }
    const cd = cropDrag.current;
    if (!cd.mode || !wrapRef.current) return;
    const wr = wrapRef.current.getBoundingClientRect();
    const dx = (e.clientX - cd.lx) / wr.width;
    const dy = (e.clientY - cd.ly) / wr.height;
    cd.lx = e.clientX;
    cd.ly = e.clientY;
    setDraft((d) => {
      let { x, y, w, h } = d.crop;
      if (cd.mode === "move") {
        x = clamp(x + dx, 0, 1 - w);
        y = clamp(y + dy, 0, 1 - h);
      } else {
        if (cd.mode === "tl") {
          const nx = clamp(x + dx, 0, x + w - MIN);
          const ny = clamp(y + dy, 0, y + h - MIN);
          w += x - nx;
          h += y - ny;
          x = nx;
          y = ny;
        } else if (cd.mode === "tr") {
          const ny = clamp(y + dy, 0, y + h - MIN);
          h += y - ny;
          y = ny;
          w = clamp(w + dx, MIN, 1 - x);
        } else if (cd.mode === "bl") {
          const nx = clamp(x + dx, 0, x + w - MIN);
          w += x - nx;
          x = nx;
          h = clamp(h + dy, MIN, 1 - y);
        } else if (cd.mode === "br") {
          w = clamp(w + dx, MIN, 1 - x);
          h = clamp(h + dy, MIN, 1 - y);
        }
      }
      return { ...d, aspect: "free", crop: { x, y, w, h } };
    });
  };
  const onStagePointerUp = () => {
    if (drawing.current) drawing.current = false;
    if (cropDrag.current.mode) {
      cropDrag.current.mode = null;
      commit(draft);
    }
  };

  // Пинч-зум кадра
  const onTouchStart = (e: React.TouchEvent) => {
    if (tab === "crop" && e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinch.current = {
        d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        rect: { ...draft.crop },
      };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (pinch.current && e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = d / pinch.current.d;
      const r = pinch.current.rect;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const w = clamp(r.w * ratio, MIN, 1);
      const h = clamp(r.h * ratio, MIN, 1);
      setDraft((dd) => ({
        ...dd,
        aspect: "free",
        crop: {
          x: clamp(cx - w / 2, 0, 1 - w),
          y: clamp(cy - h / 2, 0, 1 - h),
          w,
          h,
        },
      }));
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (pinch.current && e.touches.length < 2) {
      pinch.current = null;
      commit(draft);
    }
  };

  const clearMarkup = () => {
    const cv = markupRef.current;
    cv?.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
  };

  const runAI = async (kind: "enhance" | "removebg" | "denoise") => {
    setBusy(kind === "removebg" ? "Загрузка ИИ-модели…" : "Обработка…");
    try {
      const baked = await renderEdited(workingSrc, {
        adjust: draft.adjust,
        presetCss,
        rotateDeg: draft.rotate,
        flipH: draft.flipH,
        flipV: draft.flipV,
        crop: renderCrop,
        markup: markupRef.current,
      });
      let out: string;
      if (kind === "enhance") out = await autoEnhance(baked);
      else if (kind === "denoise") out = await denoise(baked);
      else
        out = await removeBackground(baked, (p) => {
          if (p?.progress) setBusy(`Обработка… ${Math.round(p.progress)}%`);
        });
      setWorkingSrc(out);
      clearMarkup();
      commit({ ...INIT });
    } catch {
      setBusy("Не удалось");
      setTimeout(() => setBusy(""), 1200);
      return;
    }
    setBusy("");
  };

  const save = async () => {
    setBusy("Сохранение…");
    try {
      const url = await renderEdited(workingSrc, {
        adjust: draft.adjust,
        presetCss,
        rotateDeg: draft.rotate,
        flipH: draft.flipH,
        flipV: draft.flipV,
        crop: renderCrop,
        markup: markupRef.current,
      });
      onSave(url);
    } catch {
      onCancel();
    }
  };

  const activeTool = TOOLS.find((t) => t.key === tool)!;
  const cf = draft.crop;

  return (
    <div className="editor">
      <header className="editor-top">
        <button className="overlay-link" onClick={onCancel}>
          Отмена
        </button>
        <div className="editor-top-tools">
          <button className="etool" onClick={undo} disabled={hi === 0}>
            <UndoIcon size={22} />
          </button>
          <button className="etool" onClick={redo} disabled={hi >= hist.length - 1}>
            <RedoIcon size={22} />
          </button>
          <button className={`etool ${markupMode ? "on" : ""}`} onClick={() => setMarkupMode((v) => !v)}>
            <MarkupIcon size={22} />
          </button>
        </div>
        <button className="overlay-link strong" onClick={save}>
          Готово
        </button>
      </header>

      <div
        className="editor-stage"
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={onStagePointerUp}
        onPointerLeave={onStagePointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="edit-wrap"
          ref={wrapRef}
          style={{
            transform: `rotate(${draft.rotate}deg) scale(${draft.flipH ? -1 : 1}, ${draft.flipV ? -1 : 1})`,
          }}
        >
          <img
            src={workingSrc}
            alt=""
            style={{ filter: previewFilter }}
            draggable={false}
            crossOrigin="anonymous"
            onLoad={(e) =>
              setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
            }
          />
          {draft.adjust.vignette > 0 && (
            <span className="vignette-ov" style={{ opacity: draft.adjust.vignette / 100 }} />
          )}
          <canvas
            ref={markupRef}
            className="markup-layer"
            style={{ pointerEvents: markupMode ? "auto" : "none" }}
          />
          {tab === "crop" && (
            <div
              className="crop-frame"
              style={{
                left: `${cf.x * 100}%`,
                top: `${cf.y * 100}%`,
                width: `${cf.w * 100}%`,
                height: `${cf.h * 100}%`,
              }}
              onPointerDown={(e) => cropPointerDown(e, "move")}
            >
              <span className="crop-grid" />
              <span className="ch tl" onPointerDown={(e) => cropPointerDown(e, "tl")} />
              <span className="ch tr" onPointerDown={(e) => cropPointerDown(e, "tr")} />
              <span className="ch bl" onPointerDown={(e) => cropPointerDown(e, "bl")} />
              <span className="ch br" onPointerDown={(e) => cropPointerDown(e, "br")} />
            </div>
          )}
        </div>
        {busy && <div className="editor-busy glass">{busy}</div>}
        {markupMode && (
          <div className="markup-colors glass">
            {colors.map((c) => (
              <button
                key={c}
                className={`swatch ${color === c ? "on" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <button className="markup-clear" onClick={clearMarkup}>
              Очистить
            </button>
          </div>
        )}
      </div>

      <div className="editor-panel">
        {tab === "adjust" && (
          <>
            <div className="tool-rail">
              <button
                className="tool-chip"
                onClick={() =>
                  commit({
                    ...draft,
                    adjust: { ...draft.adjust, exposure: 12, contrast: 16, saturation: 14, vibrance: 18 },
                  })
                }
              >
                <span className="tool-ico">
                  <SparklesIcon size={22} />
                </span>
                Авто
              </button>
              {TOOLS.map((t) => (
                <button
                  key={t.key}
                  className={`tool-chip ${tool === t.key ? "on" : ""} ${draft.adjust[t.key] !== 0 ? "edited" : ""}`}
                  onClick={() => setTool(t.key)}
                >
                  <span className="tool-ico">{Math.round(draft.adjust[t.key])}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="tool-slider">
              <input
                type="range"
                min={activeTool.min}
                max={activeTool.max}
                value={draft.adjust[tool]}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, adjust: { ...d.adjust, [tool]: +e.target.value } }))
                }
                onPointerUp={() => commit(draft)}
              />
            </div>
          </>
        )}

        {tab === "filters" && (
          <div className="filter-rail">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                className={`filter-chip ${draft.preset === p.key ? "on" : ""}`}
                onClick={() => commit({ ...draft, preset: p.key })}
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

        {tab === "crop" && (
          <div className="crop-panel">
            <div className="seg-row">
              {aspects.map((a) => (
                <button
                  key={a.key}
                  className={`chip ${draft.aspect === a.key ? "on" : ""}`}
                  onClick={() => setAspect(a.key)}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <div className="rotate-row">
              <button className="chip" onClick={() => commit({ ...draft, rotate: draft.rotate - 90 })}>
                <RotateCwIcon size={18} /> 90°
              </button>
              <button className="chip" onClick={() => commit({ ...draft, flipH: !draft.flipH })}>
                <FlipHIcon size={18} /> Отразить
              </button>
              <button className="chip" onClick={() => commit({ ...draft, crop: { ...FULL }, aspect: "free" })}>
                Сброс
              </button>
            </div>
          </div>
        )}

        {tab === "ai" && (
          <div className="ai-rail">
            <button className="ai-card" onClick={() => runAI("enhance")}>
              <span className="ai-ico"><SparklesIcon size={24} /></span>
              Улучшить
            </button>
            <button className="ai-card" onClick={() => runAI("removebg")}>
              <span className="ai-ico"><EraserIcon size={24} /></span>
              Удалить фон
            </button>
            <button className="ai-card" onClick={() => runAI("denoise")}>
              <span className="ai-ico"><SparklesIcon size={24} /></span>
              Убрать шум
            </button>
          </div>
        )}
      </div>

      <nav className="editor-tabs">
        <button className={`etab ${tab === "adjust" ? "on" : ""}`} onClick={() => { setTab("adjust"); setMarkupMode(false); }}>
          Изменить
        </button>
        <button className={`etab ${tab === "filters" ? "on" : ""}`} onClick={() => { setTab("filters"); setMarkupMode(false); }}>
          Фильтры
        </button>
        <button className={`etab ${tab === "crop" ? "on" : ""}`} onClick={() => { setTab("crop"); setMarkupMode(false); }}>
          Обрезать
        </button>
        <button className={`etab ${tab === "ai" ? "on" : ""}`} onClick={() => { setTab("ai"); setMarkupMode(false); }}>
          ИИ
        </button>
        <button className="etab save-dot" onClick={save} aria-label="Готово">
          <CheckIcon size={20} />
        </button>
      </nav>
    </div>
  );
}
