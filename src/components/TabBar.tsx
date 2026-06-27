import { PhotoStackIcon, AlbumsIcon, SearchIcon } from "../icons";

export type Tab = "library" | "albums" | "search";

const tabs: { key: Tab; label: string; Icon: typeof PhotoStackIcon }[] = [
  { key: "library", label: "Медиатека", Icon: PhotoStackIcon },
  { key: "albums", label: "Альбомы", Icon: AlbumsIcon },
  { key: "search", label: "Поиск", Icon: SearchIcon },
];

export function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav className="tab-bar glass">
      {tabs.map(({ key, label, Icon }) => (
        <button
          key={key}
          className={`tab-item ${active === key ? "active" : ""}`}
          onClick={() => onChange(key)}
        >
          <Icon size={26} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
