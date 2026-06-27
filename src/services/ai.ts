import { loadImage } from "../lib/imageEdit";

// On-device ИИ через Transformers.js (Hugging Face).
// Библиотека и модель грузятся с CDN во время выполнения — без ключей,
// без сервера, без раздувания бандла. Считается локально (приватно).

const TF_CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";

type Progress = (p: { status?: string; progress?: number }) => void;

let tfPromise: Promise<any> | null = null;
async function getTF(): Promise<any> {
  if (!tfPromise) {
    // @ts-ignore — рантайм-импорт ESM с CDN, Vite его не бандлит
    tfPromise = import(/* @vite-ignore */ TF_CDN).then((TF: any) => {
      TF.env.allowLocalModels = false;
      return TF;
    });
  }
  return tfPromise;
}

let rmbg: { model: any; processor: any } | null = null;

/**
 * Удаление фона (модель RMBG-1.4). Возвращает PNG dataURL с прозрачностью.
 * Первая загрузка качает модель (~44 МБ) с CDN, далее кэшируется.
 */
export async function removeBackground(
  src: string,
  onProgress?: Progress
): Promise<string> {
  const TF = await getTF();
  if (!rmbg) {
    const model = await TF.AutoModel.from_pretrained("briaai/RMBG-1.4", {
      progress_callback: onProgress,
    });
    const processor = await TF.AutoProcessor.from_pretrained("briaai/RMBG-1.4");
    rmbg = { model, processor };
  }

  const image = await TF.RawImage.fromURL(src);
  const { pixel_values } = await rmbg.processor(image);
  const { output } = await rmbg.model({ input: pixel_values });

  const mask = await TF.RawImage.fromTensor(
    output[0].mul(255).to("uint8")
  ).resize(image.width, image.height);

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");

  const imgEl = await loadImage(src);
  ctx.drawImage(imgEl, 0, 0, image.width, image.height);
  const data = ctx.getImageData(0, 0, image.width, image.height);
  for (let i = 0; i < mask.data.length; i++) {
    data.data[i * 4 + 3] = mask.data[i]; // альфа из маски
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}
