export interface GeoLocation {
  lat: number;
  lng: number;
  altitude?: number;
}

export interface PhotoMeta {
  camera?: string;
  lens?: string;
  fileName?: string;
  fileSize?: number; // байты
  iso?: number;
  aperture?: string; // f/1.8
  shutter?: string; // 1/120
  focalLength?: string; // 26 мм
}

export type MediaKind =
  | "photo"
  | "video"
  | "live"
  | "selfie"
  | "screenshot"
  | "screenrec";

export interface Photo {
  id: string;
  /** Идентификатор ассета в нативной медиатеке (для подгрузки полного фото) */
  identifier?: string;
  /** Превью (URL или data:base64) */
  thumb: string;
  /** Полное фото (URL); null → подгружается лениво на устройстве */
  full: string | null;
  caption?: string;
  city?: string;
  country?: string;
  /** Дата съёмки */
  date: Date;
  /** Когда добавлено в медиатеку */
  addedDate?: Date;
  favorite: boolean;
  kind: MediaKind;
  pinned?: boolean;
  hidden?: boolean;
  deleted?: boolean;
  deletedDate?: Date;
  durationSec?: number; // для видео/записей экрана
  width?: number;
  height?: number;
  location?: GeoLocation;
  meta?: PhotoMeta;
  source: "demo" | "native";
}

/** Пользовательский альбом (создаётся в приложении) */
export interface UserAlbum {
  id: string;
  title: string;
  photoIds: string[];
}

export type PermissionState =
  | "checking"
  | "prompt"
  | "granted"
  | "denied"
  | "demo";
