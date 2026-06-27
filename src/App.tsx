import { useEffect, useMemo, useState } from "react";
import { TabBar, Tab } from "./components/TabBar";
import { PhotoGrid } from "./components/PhotoGrid";
import { PhotoViewer } from "./components/PhotoViewer";
import { PermissionScreen } from "./components/PermissionScreen";
import { Avatar, AvatarMenu, UserProfile } from "./components/AvatarMenu";
import { SettingsSheet } from "./components/SettingsSheet";
import { usePhotoLibrary } from "./hooks/usePhotoLibrary";
import { ChevronLeftIcon } from "./icons";
import type { Photo } from "./types";

const user: UserProfile = {
  name: "Lev Iva",
  subtitle: "Apple ID · iCloud+",
};

const segments = [
  { key: "years", label: "Годы", cols: 5 },
  { key: "months", label: "Месяцы", cols: 4 },
  { key: "all", label: "Все", cols: 3 },
];

export default function App() {
  const {
    permission,
    photos,
    loading,
    requestAndLoad,
    toggleFavorite,
    removePhoto,
    setCity,
  } = usePhotoLibrary();

  const [tab, setTab] = useState<Tab>("library");
  const [seg, setSeg] = useState("all");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [album, setAlbum] = useState<{ title: string; photos: Photo[] } | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const columns = segments.find((s) => s.key === seg)?.cols ?? 3;

  // Список, по которому листает просмотрщик (живой, чтобы удаление отражалось)
  const viewerList = album ? album.photos : photos;

  // Подстраховка: индекс не выходит за границы после удаления
  useEffect(() => {
    if (viewerIndex === null) return;
    if (viewerList.length === 0) setViewerIndex(null);
    else if (viewerIndex > viewerList.length - 1)
      setViewerIndex(viewerList.length - 1);
  }, [viewerList, viewerIndex]);

  const collections = useMemo(() => {
    const favorites = photos.filter((p) => p.favorite);
    const recents = photos.slice(0, 12);
    const cityMap = new Map<string, Photo[]>();
    for (const p of photos) {
      if (!p.city) continue;
      const arr = cityMap.get(p.city) ?? [];
      arr.push(p);
      cityMap.set(p.city, arr);
    }
    const result: { title: string; photos: Photo[] }[] = [
      { title: "Избранное", photos: favorites },
      { title: "Недавние", photos: recents },
    ];
    for (const [city, items] of cityMap) result.push({ title: city, photos: items });
    return result.filter((c) => c.photos.length > 0);
  }, [photos]);

  const openPhotoIn = (list: Photo[], p: Photo, asAlbum?: { title: string }) => {
    const idx = list.findIndex((x) => x.id === p.id);
    if (asAlbum) setAlbum({ title: asAlbum.title, photos: list });
    setViewerIndex(idx >= 0 ? idx : 0);
  };

  // Экран запроса доступа (на устройстве, пока доступ не выдан)
  const needPermission = permission === "prompt" || permission === "denied";

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
            <main className="content">
              {tab === "library" && (
                <>
                  <Header title="Медиатека" user={user} onAvatar={() => setAvatarOpen(true)} />
                  <PhotoGrid
                    photos={photos}
                    columns={columns}
                    onOpen={(p) => openPhotoIn(photos, p)}
                  />
                </>
              )}

              {tab === "collections" && !album && (
                <>
                  <Header title="Коллекции" user={user} onAvatar={() => setAvatarOpen(true)} />
                  <div className="albums">
                    {collections.map((c) => (
                      <button
                        key={c.title}
                        className="album-card"
                        onClick={() => setAlbum(c)}
                      >
                        <div className="album-cover">
                          <img src={c.photos[0].thumb} alt={c.title} draggable={false} />
                        </div>
                        <div className="album-info">
                          <span className="album-title">{c.title}</span>
                          <span className="album-count">{c.photos.length}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {tab === "collections" && album && (
                <>
                  <div className="album-head">
                    <button className="back-link" onClick={() => setAlbum(null)}>
                      <ChevronLeftIcon size={22} />
                      <span>Коллекции</span>
                    </button>
                    <h1 className="big-title">{album.title}</h1>
                  </div>
                  <PhotoGrid
                    photos={album.photos}
                    columns={3}
                    onOpen={(p) => openPhotoIn(album.photos, p, { title: album.title })}
                  />
                </>
              )}
            </main>

            {tab === "library" && (
              <div className="segmented glass">
                {segments.map((s) => (
                  <button
                    key={s.key}
                    className={`seg ${seg === s.key ? "active" : ""}`}
                    onClick={() => setSeg(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <TabBar
              active={tab}
              onChange={(t) => {
                setTab(t);
                setAlbum(null);
              }}
            />
          </>
        )}

        {viewerIndex !== null && viewerList[viewerIndex] && (
          <PhotoViewer
            photos={viewerList}
            index={viewerIndex}
            onIndexChange={setViewerIndex}
            onClose={() => {
              setViewerIndex(null);
              if (tab === "library") setAlbum(null);
            }}
            onToggleFavorite={toggleFavorite}
            onDelete={removePhoto}
            onSetCity={setCity}
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
        {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      </div>
    </div>
  );
}

function Header({
  title,
  user,
  onAvatar,
}: {
  title: string;
  user: UserProfile;
  onAvatar: () => void;
}) {
  return (
    <div className="top-head">
      <h1 className="big-title">{title}</h1>
      <Avatar user={user} size={34} onClick={onAvatar} />
    </div>
  );
}
