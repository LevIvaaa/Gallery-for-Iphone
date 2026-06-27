import { CloseIcon, ChevronRightIcon } from "../icons";

const sections: { title: string; items: string[] }[] = [
  { title: "Медиатека", items: ["Использование iCloud", "Оптимизация хранилища", "Сетка по дням"] },
  { title: "Просмотр", items: ["Тема (как в системе)", "Показывать метаданные", "Карты в геолокации"] },
  { title: "Конфиденциальность", items: ["Доступ к фото", "Геоданные"] },
];

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="settings-sheet glass"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <h3>Настройки</h3>
          <button className="sheet-close" onClick={onClose} aria-label="Закрыть">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="settings-list">
          {sections.map((s) => (
            <div key={s.title} className="settings-group">
              <div className="settings-group-title">{s.title}</div>
              {s.items.map((it) => (
                <button key={it} className="settings-row">
                  <span>{it}</span>
                  <ChevronRightIcon size={16} className="row-chevron" />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
