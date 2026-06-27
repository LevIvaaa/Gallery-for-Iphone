import { useEffect, useMemo, useRef, useState } from "react";
import { BottomBar, Tab } from "./components/BottomBar";
import { PhotoGrid } from "./components/PhotoGrid";
import { PhotoViewer } from "./components/PhotoViewer";
import { PermissionScreen } from "./components/PermissionScreen";
import { Avatar, AvatarMenu, UserProfile } from "./components/AvatarMenu";
import { SettingsSheet, Settings, DEFAULT_SETTINGS } from "./components/SettingsSheet";
import { Collections, OpenCollection } from "./components/Collections";
import { SearchScreen } from "./components/SearchScreen";
import { AddToAlbumScreen } from "./components/AddToAlbumScreen";
import { usePhotoLibrary } from "./hooks/usePhotoLibrary";
import { objectsCount, monthYearLabel } from "./lib/format";
import { ChevronLeftIcon, LockIcon } from "./icons";
import type { Photo, UserAlbum } from "./types";

const user: UserProfile = {
  name: "Lev Iva",
  subtitle: "Apple ID · iCloud+",
};

const segments = [
  { key: "years", label: "Годы", cols: 5 },
  { key: "months", label: "Месяцы", cols: 4 },
  { key: "all", label: "Все", cols: 3 },
];

interface OpenAlbum {
  title: string;
  photos: Photo[];
  hint?: string;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

export default function App() {
  const {
    permission,
    photos,
    loading,
    requestAndLoad,
    toggleFavorite,
    removePhoto,
    setCity,
    updatePhoto,
    toggleHidden,
  } = usePhotoLibrary();

  const [tab, setTab] = useState<Tab>("library");
  const [libCols, setLibCols] = useState(3);
  const [colCols, setColCols] = useState(2);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [album, setAlbum] = useState<OpenAlbum | null>(null);
  const [albums, setAlbums] = useState<UserAlbum[]>([]);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addAlbumOpen, setAddAlbumOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  // Видимость бара Годы/Месяцы/Все: появляется при прокрутке середины ленты
  const [segVisible, setSegVisible] = useState(false);
  // Подзаголовок медиатеки: «N объектов» вверху, дата при прокрутке
  const [libSubtitle, setLibSubtitle] = useState("");

  const contentRef = useRef<HTMLElement>(null);
  const libColsRef = useRef(libCols);
  libColsRef.current = libCols;

  const visiblePhotos = useMemo(
    () => photos.filter((p) => !p.hidden),
    [photos]
  );
  const viewerList = album ? album.photos : visiblePhotos;

  useEffect(() => {
    if (viewerIndex === null) return;
    if (viewerList.length === 0) setViewerIndex(null);
    else if (viewerIndex > viewerList.length - 1)
      setViewerIndex(viewerList.length - 1);
  }, [viewerList, viewerIndex]);

  // Скролл-логика: бар Годы/Месяцы/Все виден в середине ленты,
  // прячется наверху (только зашёл) и в самом низу (#бар).
  const handleScroll = () => {
    const el = contentRef.current;
    if (!el || tab !== "library" || album) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atTop = scrollTop < 12;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 12;
    setSegVisible(!atTop && !atBottom);

    // Подзаголовок: вверху — счётчик, при прокрутке — месяц/год верхнего фото
    if (atTop) {
      setLibSubtitle(objectsCount(visiblePhotos.length));
    } else {
      const cell = el.clientWidth / libCols;
      const idx = Math.min(
        Math.floor(scrollTop / cell) * libCols,
        visiblePhotos.length - 1
      );
      const ph = visiblePhotos[Math.max(0, idx)];
      if (ph) setLibSubtitle(monthYearLabel(ph.date));
    }
  };

  useEffect(() => {
    if (tab !== "library" || album) setSegVisible(false);
  }, [tab, album]);

  // Счётчик объектов как стартовый подзаголовок
  useEffect(() => {
    setLibSubtitle(objectsCount(visiblePhotos.length));
  }, [visiblePhotos.length]);

  // Применение темы из настроек
  useEffect(() => {
    const el = document.documentElement;
    if (settings.theme === "system") delete el.dataset.theme;
    else el.dataset.theme = settings.theme;
  }, [settings.theme]);

  // Пинч-зум сетки (как в iOS): два пальца меняют число колонок
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    let startDist = 0;
    let startCols = libColsRef.current;
    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        startCols = libColsRef.current;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDist) {
        e.preventDefault();
        const ratio = dist(e.touches) / startDist;
        // развести пальцы (ratio>1) → меньше колонок (крупнее), свести → больше
        const delta = Math.round((ratio - 1) * 4);
        setLibCols(clamp(startCols - delta, 2, 6));
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) startDist = 0;
    };
    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  const openPhotoIn = (list: Photo[], p: Photo, keepAlbum?: boolean) => {
    if (!keepAlbum) setAlbum(null);
    const idx = list.findIndex((x) => x.id === p.id);
    setViewerIndex(idx >= 0 ? idx : 0);
  };

  const openCollection = (c: OpenCollection) => {
    setAlbum({ title: c.title, photos: c.photos, hint: c.emptyHint });
  };

  const createAlbum = (name: string, ids: string[]) => {
    setAlbums((prev) => [
      ...prev,
      { id: `al-${Date.now()}`, title: name, photoIds: ids },
    ]);
    setAddAlbumOpen(false);
  };

  const needPermission = permission === "prompt" || permission === "denied";
  // Вкладка «Коллекции» прячется влево, когда показан бар Годы/Месяцы/Все
  const collapseTabs = tab === "library" && !album && segVisible;

  return (
    <div className="phone">
      <div className="screen">
        {needPermission ? (
          <PermissionScreen
            state={permission}
            loading={loading}
            onRequest={requestAndLoad}
          />
        ) : (
          <>
            <main className="content" ref={contentRef} onScroll={handleScroll}>
              <div className="view" key={`${tab}${album ? "-album" : ""}`}>
                {tab === "library" && !album && (
                  <>
                    <Header
                      title="Медиатека"
                      subtitle={libSubtitle}
                      user={user}
                      onAvatar={() => setAvatarOpen(true)}
                    />
                    <PhotoGrid
                      photos={visiblePhotos}
                      columns={libCols}
                      grouped={settings.gridByDays}
                      onOpen={(p) => openPhotoIn(visiblePhotos, p)}
                    />
                  </>
                )}

                {tab === "collections" && !album && (
                  <>
                    <Header
                      title="Коллекции"
                      user={user}
                      onAvatar={() => setAvatarOpen(true)}
                    />
                    <Collections
                      photos={photos}
                      albums={albums}
                      columns={colCols}
                      onColumns={setColCols}
                      onOpen={openCollection}
                      onCreateAlbum={() => setAddAlbumOpen(true)}
                    />
                  </>
                )}

                {album && (
                  <>
                    <div className="top-head sticky album-sticky scrim">
                      <button className="back-link" onClick={() => setAlbum(null)}>
                        <ChevronLeftIcon size={22} />
                        <span>Назад</span>
                      </button>
                      <h1 className="big-title small">{album.title}</h1>
                    </div>
                    {album.photos.length ? (
                      <PhotoGrid
                        photos={album.photos}
                        columns={colCols + 1}
                        onOpen={(p) => openPhotoIn(album.photos, p, true)}
                      />
                    ) : (
                      <div className="empty-album">
                        <LockIcon size={42} />
                        <p>{album.hint || "Здесь пока пусто."}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>

            {tab === "library" && !album && (
              <div className={`segmented glass ${segVisible ? "show" : ""}`}>
                {segments.map((s) => (
                  <button
                    key={s.key}
                    className={`seg ${libCols === s.cols ? "active" : ""}`}
                    onClick={() => setLibCols(s.cols)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <BottomBar
              active={tab}
              collapsed={collapseTabs}
              onChange={(t) => {
                setTab(t);
                setAlbum(null);
              }}
              onSearch={() => setSearchOpen(true)}
            />
          </>
        )}

        {viewerIndex !== null && viewerList[viewerIndex] && (
          <PhotoViewer
            photos={viewerList}
            index={viewerIndex}
            showMaps={settings.maps}
            onIndexChange={setViewerIndex}
            onClose={() => setViewerIndex(null)}
            onToggleFavorite={toggleFavorite}
            onDelete={removePhoto}
            onSetCity={setCity}
            onUpdatePhoto={updatePhoto}
            onToggleHidden={toggleHidden}
          />
        )}

        {searchOpen && (
          <SearchScreen
            photos={visiblePhotos}
            onOpen={(p) => {
              setSearchOpen(false);
              openPhotoIn(visiblePhotos, p);
            }}
            onClose={() => setSearchOpen(false)}
          />
        )}

        {addAlbumOpen && (
          <AddToAlbumScreen
            photos={visiblePhotos}
            onCancel={() => setAddAlbumOpen(false)}
            onCreate={createAlbum}
          />
        )}

        {avatarOpen && (
          <AvatarMenu
            user={user}
            onClose={() => setAvatarOpen(false)}
            onOpenSettings={() => {
              setAvatarOpen(false);
              setSettingsOpen(true);
            }}
          />
        )}
        {settingsOpen && (
          <SettingsSheet
            settings={settings}
            onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function Header({
  title,
  subtitle,
  user,
  onAvatar,
}: {
  title: string;
  subtitle?: string;
  user: UserProfile;
  onAvatar: () => void;
}) {
  return (
    <div className="top-head sticky scrim">
      <div className="head-titles">
        <h1 className="big-title">{title}</h1>
        {subtitle && <p className="head-sub">{subtitle}</p>}
      </div>
      <Avatar user={user} size={34} onClick={onAvatar} />
    </div>
  );
}
