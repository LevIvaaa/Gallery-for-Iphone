export interface Adjust {
  brightness: number; // %
  contrast: number; // %
  saturation: number; // %
  warmth: number; // -100..100
}

export const NEUTRAL: Adjust = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
};

export interface FilterPreset {
  key: string;
  label: string;
  css: string; // дополнительный css-filter
}

export const PRESETS: FilterPreset[] = [
  { key: "original", label: "Оригинал", css: "" },
  { key: "vivid", label: "Ярко", css: "saturate(1.4) contrast(1.1)" },
  { key: "drama", label: "Драма", css: "contrast(1.3) brightness(0.95) saturate(1.1)" },
  { key: "mono", label: "Ч/Б", css: "grayscale(1) contrast(1.1)" },
  { key: "sepia", label: "Сепия", css: "sepia(0.7) contrast(1.05)" },
  { key: "cold", label: "Холод", css: "saturate(1.1) hue-rotate(-12deg) brightness(1.02)" },
  { key: "warm", label: "Тепло", css: "sepia(0.25) saturate(1.2) brightness(1.03)" },
];

/** CSS-filter из коррекций (тепло эмулируем sepia + hue) */
export function adjustCss(a: Adjust): string {
  const warm =
    a.warmth >= 0
      ? `sepia(${(a.warmth / 100) * 0.4}) saturate(${1 + (a.warmth / 100) * 0.1})`
      : `hue-rotate(${(a.warmth / 100) * 14}deg) saturate(${1 - (a.warmth / 100) * -0.1})`;
  return `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) ${warm}`;
}

export function fullFilter(a: Adjust, presetCss: string): string {
  return `${adjustCss(a)} ${presetCss}`.trim();
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
} // в долях 0..1 от изображения

export interface RenderOptions {
  adjust: Adjust;
  presetCss: string;
  rotateDeg: number; // 0/90/180/270
  crop?: CropRect | null;
  markup?: HTMLCanvasElement | null; // слой разметки в координатах исходного изображения
}

/** Итоговый рендер всех правок в JPEG dataURL */
export async function renderEdited(
  src: string,
  opts: RenderOptions
): Promise<string> {
  const img = await loadImage(src);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Область кадрирования в пикселях
  const crop = opts.crop;
  const cx = crop ? crop.x * iw : 0;
  const cy = crop ? crop.y * ih : 0;
  const cw = crop ? crop.w * iw : iw;
  const ch = crop ? crop.h * ih : ih;

  const rot = ((opts.rotateDeg % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;

  const canvas = document.createElement("canvas");
  canvas.width = swap ? ch : cw;
  canvas.height = swap ? cw : ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d ctx");

  ctx.save();
  ctx.filter = fullFilter(opts.adjust, opts.presetCss) || "none";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  // рисуем обрезанную часть по центру
  ctx.drawImage(img, cx, cy, cw, ch, -cw / 2, -ch / 2, cw, ch);
  ctx.restore();

  // Разметка поверх (без фильтра), в координатах кадра
  if (opts.markup) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(opts.markup, cx, cy, cw, ch, -cw / 2, -ch / 2, cw, ch);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

/** Авто-улучшение: контраст + насыщенность + лёгкая резкость */
export async function autoEnhance(src: string): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");
  ctx.filter = "contrast(1.12) saturate(1.18) brightness(1.03)";
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/** Шумоподавление: лёгкое сглаживание + восстановление контраста */
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
