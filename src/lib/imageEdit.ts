// Модель коррекций (как в Фото iOS / Snapseed). Значения -100..100 (или 0..100).
export interface Adjust {
  exposure: number;
  brilliance: number;
  highlights: number;
  shadows: number;
  contrast: number;
  blackpoint: number;
  saturation: number;
  vibrance: number;
  warmth: number;
  tint: number;
  definition: number;
  sharpness: number; // 0..100, применяется при сохранении
  vignette: number; // 0..100
}

export const NEUTRAL: Adjust = {
  exposure: 0,
  brilliance: 0,
  highlights: 0,
  shadows: 0,
  contrast: 0,
  blackpoint: 0,
  saturation: 0,
  vibrance: 0,
  warmth: 0,
  tint: 0,
  definition: 0,
  sharpness: 0,
  vignette: 0,
};

export interface ToolDef {
  key: keyof Adjust;
  label: string;
  min: number;
  max: number;
}

export const TOOLS: ToolDef[] = [
  { key: "exposure", label: "Экспозиция", min: -100, max: 100 },
  { key: "brilliance", label: "Блеск", min: -100, max: 100 },
  { key: "highlights", label: "Света", min: -100, max: 100 },
  { key: "shadows", label: "Тени", min: -100, max: 100 },
  { key: "contrast", label: "Контраст", min: -100, max: 100 },
  { key: "blackpoint", label: "Чёрная точка", min: -100, max: 100 },
  { key: "saturation", label: "Насыщенность", min: -100, max: 100 },
  { key: "vibrance", label: "Сочность", min: -100, max: 100 },
  { key: "warmth", label: "Теплота", min: -100, max: 100 },
  { key: "tint", label: "Оттенок", min: -100, max: 100 },
  { key: "definition", label: "Чёткость", min: -100, max: 100 },
  { key: "sharpness", label: "Резкость", min: 0, max: 100 },
  { key: "vignette", label: "Виньетка", min: 0, max: 100 },
];

export interface FilterPreset {
  key: string;
  label: string;
  css: string;
}

export const PRESETS: FilterPreset[] = [
  { key: "original", label: "Ориг.", css: "" },
  { key: "vivid", label: "Ярко", css: "saturate(1.45) contrast(1.1)" },
  { key: "vividwarm", label: "Ярко тёпл.", css: "saturate(1.4) contrast(1.08) sepia(0.18)" },
  { key: "dramatic", label: "Драма", css: "contrast(1.35) brightness(0.95) saturate(1.05)" },
  { key: "mono", label: "Ч/Б", css: "grayscale(1) contrast(1.1)" },
  { key: "silvertone", label: "Серебро", css: "grayscale(1) contrast(1.2) brightness(1.05)" },
  { key: "noir", label: "Нуар", css: "grayscale(1) contrast(1.5) brightness(0.9)" },
  { key: "sepia", label: "Сепия", css: "sepia(0.75) contrast(1.05)" },
  { key: "cold", label: "Холод", css: "saturate(1.1) hue-rotate(-12deg) brightness(1.02)" },
  { key: "warm", label: "Тепло", css: "sepia(0.3) saturate(1.2) brightness(1.03)" },
];

/** CSS-фильтр коррекций для живого превью */
export function buildFilter(a: Adjust, presetCss = ""): string {
  const exposure = 1 + a.exposure / 180 + a.shadows / 700;
  const brightness = Math.max(0, exposure * (1 + a.brilliance / 500));
  const contrast = Math.max(
    0,
    1 +
      a.contrast / 130 +
      a.brilliance / 400 +
      a.definition / 260 +
      a.blackpoint / 320 -
      a.highlights / 650
  );
  const saturate = Math.max(
    0,
    1 + a.saturation / 130 + a.vibrance / 220 + a.definition / 420
  );
  const sepia = a.warmth > 0 ? a.warmth / 240 : 0;
  const hue = a.tint * 0.5 + (a.warmth < 0 ? a.warmth * 0.12 : 0);
  return [
    `brightness(${brightness.toFixed(3)})`,
    `contrast(${contrast.toFixed(3)})`,
    `saturate(${saturate.toFixed(3)})`,
    sepia ? `sepia(${sepia.toFixed(3)})` : "",
    hue ? `hue-rotate(${hue.toFixed(1)}deg)` : "",
    presetCss,
  ]
    .filter(Boolean)
    .join(" ");
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RenderOptions {
  adjust: Adjust;
  presetCss: string;
  rotateDeg: number;
  flipH: boolean;
  flipV: boolean;
  crop?: CropRect | null;
  markup?: HTMLCanvasElement | null;
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  if (amount <= 0) return;
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${(amount / 100) * 0.85})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function applySharpen(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  if (amount <= 0) return;
  const k = amount / 100; // 0..1
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const s = src.data;
  const d = out.data;
  const center = 1 + 4 * k;
  const side = -k;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const idx = i + c;
        let v = s[idx] * center;
        v += (x > 0 ? s[idx - 4] : s[idx]) * side;
        v += (x < w - 1 ? s[idx + 4] : s[idx]) * side;
        v += (y > 0 ? s[idx - w * 4] : s[idx]) * side;
        v += (y < h - 1 ? s[idx + w * 4] : s[idx]) * side;
        d[idx] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      d[i + 3] = s[i + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
}

/** Финальный рендер всех правок в JPEG dataURL */
export async function renderEdited(src: string, opts: RenderOptions): Promise<string> {
  const img = await loadImage(src);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const crop = opts.crop;
  const cx = crop ? crop.x * iw : 0;
  const cy = crop ? crop.y * ih : 0;
  const cw = crop ? crop.w * iw : iw;
  const ch = crop ? crop.h * ih : ih;

  const rot = ((opts.rotateDeg % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(swap ? ch : cw);
  canvas.height = Math.round(swap ? cw : ch);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d ctx");

  ctx.save();
  ctx.filter = buildFilter(opts.adjust, opts.presetCss) || "none";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(opts.flipH ? -1 : 1, opts.flipV ? -1 : 1);
  ctx.drawImage(img, cx, cy, cw, ch, -cw / 2, -ch / 2, cw, ch);
  ctx.restore();

  if (opts.adjust.sharpness > 0) {
    applySharpen(ctx, canvas.width, canvas.height, opts.adjust.sharpness);
  }
  drawVignette(ctx, canvas.width, canvas.height, opts.adjust.vignette);

  if (opts.markup) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(opts.flipH ? -1 : 1, opts.flipV ? -1 : 1);
    ctx.drawImage(opts.markup, cx, cy, cw, ch, -cw / 2, -ch / 2, cw, ch);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function autoEnhance(src: string): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");
  ctx.filter = "contrast(1.12) saturate(1.18) brightness(1.04)";
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function denoise(src: string): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");
  ctx.filter = "blur(0.7px) contrast(1.06) saturate(1.03)";
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}
