import { PhotoStackIcon, AlbumsIcon } from "../icons";

export type Tab = "library" | "collections";

const tabs: { key: Tab; label: string; Icon: typeof PhotoStackIcon }[] = [
  { key: "library", label: "Медиатека", Icon: PhotoStackIcon },
  { key: "collections", label: "Коллекции", Icon: AlbumsIcon },
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
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
