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
  DotsIcon,
  RotateCwIcon,
  FlipHIcon,
  SparklesIcon,
  CheckIcon,
} from "../icons";

type Tab = "adjust" | "filters" | "crop";

interface ES {
  adjust: Adjust;
  preset: string;
  rotate: number;
  flipH: boolean;
  flipV: boolean;
  aspect: string;
  scale: number;
  cx: number;
  cy: number;
}

const INIT: ES = {
  adjust: { ...NEUTRAL },
  preset: "original",
  rotate: 0,
  flipH: false,
  flipV: false,
  aspect: "free",
  scale: 1,
  cx: 0.5,
  cy: 0.5,
};

const aspects = [
  { key: "free", label: "Свободно", r: null as number | null },
  { key: "square", label: "1:1", r: 1 },
  { key: "p45", label: "4:5", r: 4 / 5 },
  { key: "w169", label: "16:9", r: 16 / 9 },
];

const colors = ["#ff375f", "#ffd60a", "#30d158", "#0a84ff", "#ffffff", "#000000"];

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
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState("");

  const markupRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dragCrop = useRef(false);

  const presetCss = PRESETS.find((p) => p.key === draft.preset)?.css ?? "";
  const previewFilter = buildFilter(draft.adjust, presetCss);

  useEffect(() => {
    if (nat.w && markupRef.current) {
      markupRef.current.width = nat.w;
      markupRef.current.height = nat.h;
    }
  }, [nat]);

  // ===== История (undo/redo) =====
  const commit = (next: ES) => {
    setHist((h) => [...h.slice(0, hi + 1), next]);
    setHi((i) => i + 1);
    setDraft(next);
  };
  const undo = () => {
    if (hi > 0) {
      setHi(hi - 1);
      setDraft(hist[hi - 1]);
    }
  };
  const redo = () => {
    if (hi < hist.length - 1) {
      setHi(hi + 1);
      setDraft(hist[hi + 1]);
    }
  };

  // ===== Кадрирование =====
  const cropRect = (): CropRect | null => {
    if (!nat.w) return null;
    const imgAspect = nat.w / nat.h;
    const r = aspects.find((a) => a.key === draft.aspect)?.r ?? null;
    if (r === null && draft.scale >= 1) return null;
    const ratio = r ?? imgAspect;
    let w: number, h: number;
    if (ratio >= imgAspect) {
      w = draft.scale;
      h = (imgAspect / ratio) * draft.scale;
    } else {
      h = draft.scale;
      w = (ratio / imgAspect) * draft.scale;
    }
    const cx = Math.min(Math.max(draft.cx, w / 2), 1 - w / 2);
    const cy = Math.min(Math.max(draft.cy, h / 2), 1 - h / 2);
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
    ctx.lineWidth = Math.max(6, cv.width / 110);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (markupMode) {
      drawing.current = true;
      const ctx = markupRef.current?.getContext("2d");
      ctx?.beginPath();
      drawAt(e);
    } else if (tab === "crop") {
      dragCrop.current = true;
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drawing.current) drawAt(e);
    else if (dragCrop.current && tab === "crop") {
      const wrap = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDraft((d) => ({
        ...d,
        cx: (e.clientX - wrap.left) / wrap.width,
        cy: (e.clientY - wrap.top) / wrap.height,
      }));
    }
  };
  const onPointerUp = () => {
    if (dragCrop.current) {
      dragCrop.current = false;
      commit(draft);
    }
    drawing.current = false;
  };
  const clearMarkup = () => {
    const cv = markupRef.current;
    cv?.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
  };

  // ===== ИИ =====
  const runAI = async (kind: "enhance" | "removebg" | "denoise") => {
    setMore(false);
    setBusy(kind === "removebg" ? "Загрузка ИИ-модели…" : "Обработка…");
    try {
      // запекаем текущие правки, затем применяем ИИ к результату
      const baked = await renderEdited(workingSrc, {
        adjust: draft.adjust,
        presetCss,
        rotateDeg: draft.rotate,
        flipH: draft.flipH,
        flipV: draft.flipV,
        crop,
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
      commit(INIT); // правки запечены — начинаем поверх результата
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
        crop,
        markup: markupRef.current,
      });
      onSave(url);
    } catch {
      onCancel();
    }
  };

  const activeTool = TOOLS.find((t) => t.key === tool)!;

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
          <button
            className={`etool ${markupMode ? "on" : ""}`}
            onClick={() => setMarkupMode((v) => !v)}
          >
            <MarkupIcon size={22} />
          </button>
          <div className="more-wrap">
            <button className="etool" onClick={() => setMore((v) => !v)}>
              <DotsIcon size={22} />
            </button>
            {more && (
              <div className="more-menu glass">
                <button onClick={() => runAI("enhance")}>
                  <SparklesIcon size={18} /> Улучшить (ИИ)
                </button>
                <button onClick={() => runAI("removebg")}>
                  <SparklesIcon size={18} /> Удалить фон (ИИ)
                </button>
                <button onClick={() => runAI("denoise")}>
                  <SparklesIcon size={18} /> Убрать шум (ИИ)
                </button>
              </div>
            )}
          </div>
        </div>
        <button className="overlay-link strong" onClick={save}>
          Готово
        </button>
      </header>

      <div className="editor-stage" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
        <div
          className="edit-wrap"
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
              setNat({
                w: e.currentTarget.naturalWidth,
                h: e.currentTarget.naturalHeight,
              })
            }
          />
          {draft.adjust.vignette > 0 && (
            <span
              className="vignette-ov"
              style={{ opacity: draft.adjust.vignette / 100 }}
            />
          )}
          <canvas
            ref={markupRef}
            className="markup-layer"
            style={{ pointerEvents: markupMode ? "auto" : "none" }}
            onPointerDown={onPointerDown}
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
              onPointerDown={onPointerDown}
            />
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

      {/* Панель инструментов по вкладке */}
      <div className="editor-panel">
        {tab === "adjust" && (
          <>
            <div className="tool-rail">
              <button
                className="tool-chip"
                onClick={() =>
                  commit({
                    ...draft,
                    adjust: {
                      ...draft.adjust,
                      exposure: 12,
                      contrast: 16,
                      saturation: 14,
                      vibrance: 18,
                    },
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
                  className={`tool-chip ${tool === t.key ? "on" : ""} ${
                    draft.adjust[t.key] !== 0 ? "edited" : ""
                  }`}
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
                  setDraft((d) => ({
                    ...d,
                    adjust: { ...d.adjust, [tool]: +e.target.value },
                  }))
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
                  onClick={() => commit({ ...draft, aspect: a.key })}
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
              <label className="crop-size">
                Масштаб
                <input
                  type="range"
                  min={0.4}
                  max={1}
                  step={0.01}
                  value={draft.scale}
                  onChange={(e) => setDraft((d) => ({ ...d, scale: +e.target.value }))}
                  onPointerUp={() => commit(draft)}
                />
              </label>
            </div>
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
        <button className="etab save-dot" onClick={save} aria-label="Готово">
          <CheckIcon size={20} />
        </button>
      </nav>
    </div>
  );
}
