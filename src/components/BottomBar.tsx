import { PhotoStackIcon, AlbumsIcon } from "../icons";

export type Tab = "library" | "collections";

const tabs: { key: Tab; label: string; Icon: typeof PhotoStackIcon }[] = [
  { key: "library", label: "Медиатека", Icon: PhotoStackIcon },
  { key: "collections", label: "Коллекции", Icon: AlbumsIcon },
];

export function BottomBar({
  active,
  collapsed,
  onChange,
}: {
  active: Tab;
  collapsed?: boolean;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className={`bottom-bar ${collapsed ? "collapsed" : ""}`}>
      <nav className="tab-pill glass">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`tab-item ${active === key ? "active" : ""} ${
              collapsed && key === "collections" ? "tab-hidden" : ""
            }`}
            onClick={() => onChange(key)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
