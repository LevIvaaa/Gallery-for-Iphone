import { CloseIcon, ChevronRightIcon } from "../icons";

export interface Settings {
  theme: "system" | "light" | "dark";
  gridByDays: boolean;
  showMeta: boolean;
  maps: boolean;
  icloud: boolean;
  optimize: boolean;
  geo: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  gridByDays: false,
  showMeta: true,
  maps: true,
  icloud: true,
  optimize: true,
  geo: true,
};

const themeLabel = { system: "Как в системе", light: "Светлая", dark: "Тёмная" };

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      className={`switch ${on ? "on" : ""}`}
      onClick={onClick}
      aria-pressed={on}
    >
      <span className="switch-knob" />
    </button>
  );
}

export function SettingsSheet({
  settings,
  onChange,
  onClose,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}) {
  const cycleTheme = () => {
    const order: Settings["theme"][] = ["system", "light", "dark"];
    const next = order[(order.indexOf(settings.theme) + 1) % order.length];
    onChange({ theme: next });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="settings-sheet glass" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <h3>Настройки</h3>
          <button className="sheet-close" onClick={onClose} aria-label="Закрыть">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="settings-list">
          <div className="settings-group-title">Медиатека</div>
          <div className="settings-group glass-row">
            <Row label="Использование iCloud">
              <Toggle on={settings.icloud} onClick={() => onChange({ icloud: !settings.icloud })} />
            </Row>
            <Row label="Оптимизация хранилища" div>
              <Toggle on={settings.optimize} onClick={() => onChange({ optimize: !settings.optimize })} />
            </Row>
            <Row label="Сетка по дням" div>
              <Toggle on={settings.gridByDays} onClick={() => onChange({ gridByDays: !settings.gridByDays })} />
            </Row>
          </div>

          <div className="settings-group-title">Просмотр</div>
          <div className="settings-group glass-row">
            <button className="settings-row" onClick={cycleTheme}>
              <span>Тема</span>
              <span className="settings-value">
                {themeLabel[settings.theme]}
                <ChevronRightIcon size={16} className="row-chevron" />
              </span>
            </button>
            <Row label="Показывать метаданные" div>
              <Toggle on={settings.showMeta} onClick={() => onChange({ showMeta: !settings.showMeta })} />
            </Row>
            <Row label="Карты в геолокации" div>
              <Toggle on={settings.maps} onClick={() => onChange({ maps: !settings.maps })} />
            </Row>
          </div>

          <div className="settings-group-title">Конфиденциальность</div>
          <div className="settings-group glass-row">
            <Row label="Доступ к фото">
              <span className="settings-value">Все фото</span>
            </Row>
            <Row label="Геоданные" div>
              <Toggle on={settings.geo} onClick={() => onChange({ geo: !settings.geo })} />
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  div,
  children,
}: {
  label: string;
  div?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`settings-row ${div ? "div" : ""}`}>
      <span>{label}</span>
      {children}
    </div>
  );
}
