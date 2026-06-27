import { PhotoStackIcon, AlbumsIcon, FilterIcon } from "../icons";

export type Tab = "library" | "collections";

const tabs: { key: Tab; label: string; Icon: typeof PhotoStackIcon }[] = [
  { key: "library", label: "Медиатека", Icon: PhotoStackIcon },
  { key: "collections", label: "Коллекции", Icon: AlbumsIcon },
];

export function BottomBar({
  active,
  collapsed,
  tabsHidden,
  filterActive,
  onChange,
  onFilter,
}: {
  active: Tab;
  collapsed?: boolean;
  tabsHidden?: boolean;
  filterActive?: boolean;
  onChange: (t: Tab) => void;
  onFilter: () => void;
}) {
  return (
    <div className={`bottom-bar ${collapsed ? "collapsed" : ""} ${tabsHidden ? "filter-only" : ""}`}>
      {!tabsHidden && (
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
      )}
      <button
        className={`search-fab glass ${filterActive ? "active" : ""}`}
        onClick={onFilter}
        aria-label="Фильтр"
      >
        <FilterIcon size={22} />
      </button>
    </div>
  );
}
