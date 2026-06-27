import { PhotoStackIcon } from "../icons";
import type { PermissionState } from "../types";

export function PermissionScreen({
  state,
  loading,
  onRequest,
}: {
  state: PermissionState;
  loading: boolean;
  onRequest: () => void;
}) {
  const denied = state === "denied";
  return (
    <div className="permission-screen">
      <div className="permission-icon">
        <PhotoStackIcon size={56} />
      </div>
      <h1 className="permission-title">
        {denied ? "Нет доступа к фото" : "Доступ к медиатеке"}
      </h1>
      <p className="permission-text">
        {denied ? (
          <>
            Чтобы показать ваши фотографии, разрешите доступ в{" "}
            <b>Настройки → Галерея → Фото → Все фото</b>. Снимки из iCloud
            подгружаются автоматически.
          </>
        ) : (
          <>
            «Галерея» покажет фотографии прямо из вашей медиатеки, включая
            снимки из&nbsp;iCloud. Доступ нужен только для просмотра — фото
            никуда не отправляются.
          </>
        )}
      </p>
      <button
        className="permission-btn"
        onClick={onRequest}
        disabled={loading}
      >
        {loading
          ? "Загрузка…"
          : denied
            ? "Повторить"
            : "Разрешить доступ"}
      </button>
    </div>
  );
}
