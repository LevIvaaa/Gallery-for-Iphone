import { PhotoStackIcon, AlbumsIcon, SearchIcon } from "../icons";

export type Tab = "library" | "collections";

const tabs: { key: Tab; label: string; Icon: typeof PhotoStackIcon }[] = [
  { key: "library", label: "Медиатека", Icon: PhotoStackIcon },
  { key: "collections", label: "Коллекции", Icon: AlbumsIcon },
];

export function BottomBar({
  active,
  onChange,
  onSearch,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  onSearch: () => void;
}) {
  return (
    <div className="bottom-bar">
      <nav className="tab-pill glass">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`tab-item ${active === key ? "active" : ""}`}
            onClick={() => onChange(key)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button className="search-fab glass" onClick={onSearch} aria-label="Поиск">
        <SearchIcon size={22} />
      </button>
    </div>
  );
}
