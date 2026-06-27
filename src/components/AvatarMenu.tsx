import { GearIcon, ChevronRightIcon, PersonIcon, CloseIcon } from "../icons";

export interface UserProfile {
  name: string;
  subtitle?: string;
  avatar?: string; // URL; если нет — инициалы
}

export function AvatarMenu({
  user,
  onClose,
  onOpenSettings,
}: {
  user: UserProfile;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="account-card glass" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Закрыть">
          <CloseIcon size={18} />
        </button>

        {/* Аватарка + имя */}
        <div className="account-head">
          <div className="avatar avatar-lg">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="account-name">
            <strong>{user.name}</strong>
            {user.subtitle && <small>{user.subtitle}</small>}
          </div>
        </div>

        {/* Настройки */}
        <button className="account-row" onClick={onOpenSettings}>
          <span className="row-icon">
            <GearIcon size={20} />
          </span>
          <span className="row-label">Настройки</span>
          <ChevronRightIcon size={18} className="row-chevron" />
        </button>
      </div>
    </div>
  );
}

export function Avatar({
  user,
  size = 30,
  onClick,
}: {
  user: UserProfile;
  size?: number;
  onClick?: () => void;
}) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <button
      className="avatar"
      style={{ width: size, height: size }}
      onClick={onClick}
      aria-label="Профиль"
    >
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} />
      ) : initials ? (
        <span style={{ fontSize: size * 0.4 }}>{initials}</span>
      ) : (
        <PersonIcon size={size * 0.6} />
      )}
    </button>
  );
}
