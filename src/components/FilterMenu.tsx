import {
  GridIcon,
  HeartIcon,
  PhotoStackIcon,
  VideoIcon,
  LiveIcon,
  PersonIcon,
  CropIcon,
  CheckIcon,
} from "../icons";

export type FilterKey =
  | "all"
  | "fav"
  | "photo"
  | "video"
  | "live"
  | "selfie"
  | "screenshot";

const options: { key: FilterKey; label: string; Icon: typeof GridIcon }[] = [
  { key: "all", label: "Все объекты", Icon: GridIcon },
  { key: "fav", label: "Избранные", Icon: HeartIcon },
  { key: "photo", label: "Фото", Icon: PhotoStackIcon },
  { key: "video", label: "Видео", Icon: VideoIcon },
  { key: "live", label: "Лайв фото", Icon: LiveIcon },
  { key: "selfie", label: "Селфи", Icon: PersonIcon },
  { key: "screenshot", label: "Снимки экрана", Icon: CropIcon },
];

export function FilterMenu({
  active,
  onSelect,
  onClose,
}: {
  active: FilterKey;
  onSelect: (k: FilterKey) => void;
  onClose: () => void;
}) {
  return (
    <div className="popover-backdrop" onClick={onClose}>
      <div className="popover glass" onClick={(e) => e.stopPropagation()}>
        {options.map((o) => (
          <button
            key={o.key}
            className={`popover-row ${active === o.key ? "on" : ""}`}
            onClick={() => {
              onSelect(o.key);
              onClose();
            }}
          >
            <span className="popover-label">{o.label}</span>
            {active === o.key ? <CheckIcon size={18} /> : <o.Icon size={18} />}
          </button>
        ))}
      </div>
    </div>
  );
}
