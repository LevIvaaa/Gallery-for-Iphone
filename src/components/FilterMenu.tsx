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
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="filter-sheet glass" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <h3>Фильтр</h3>
        </div>
        <div className="settings-group glass-row">
          {options.map((o, i) => (
            <button
              key={o.key}
              className={`settings-row ${i ? "div" : ""}`}
              onClick={() => {
                onSelect(o.key);
                onClose();
              }}
            >
              <span className="list-ico">
                <o.Icon size={20} />
              </span>
              <span style={{ flex: 1, textAlign: "left", marginLeft: 12 }}>
                {o.label}
              </span>
              {active === o.key && <CheckIcon size={18} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
