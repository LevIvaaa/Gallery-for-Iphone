import { useEffect, useRef, useState } from "react";
import { BottomBar, Tab } from "./components/BottomBar";
import { PhotoGrid } from "./components/PhotoGrid";
import { PhotoViewer } from "./components/PhotoViewer";
import { PermissionScreen } from "./components/PermissionScreen";
import { Avatar, AvatarMenu, UserProfile } from "./components/AvatarMenu";
import { SettingsSheet } from "./components/SettingsSheet";
import { Collections, OpenCollection } from "./components/Collections";
import { SearchScreen } from "./components/SearchScreen";
import { AddToAlbumScreen } from "./components/AddToAlbumScreen";
import { ScrollDateBubble } from "./components/ScrollDateBubble";
import { usePhotoLibrary } from "./hooks/usePhotoLibrary";
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
  } = usePhotoLibrary();

  const [tab, setTab] = useState<Tab>("library");
  const [seg, setSeg] = useState("all");
  const [colCols, setColCols] = useState(2);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [album, setAlbum] = useState<OpenAlbum | null>(null);
  const [albums, setAlbums] = useState<UserAlbum[]>([]);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addAlbumOpen, setAddAlbumOpen] = useState(false);

  const contentRef = useRef<HTMLElement>(null);
  const columns = segments.find((s) => s.key === seg)?.cols ?? 3;
  const viewerList = album ? album.photos : photos;

  useEffect(() => {
    if (viewerIndex === null) return;
    if (viewerList.length === 0) setViewerIndex(null);
    else if (viewerIndex > viewerList.length - 1)
      setViewerIndex(viewerList.length - 1);
  }, [viewerList, viewerIndex]);

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
            <main className="content" ref={contentRef}>
              {tab === "library" && (
                <>
                  <StickyHeader
                    title="Медиатека"
                    user={user}
                    onAvatar={() => setAvatarOpen(true)}
                  />
                  <PhotoGrid
                    photos={photos}
                    columns={columns}
                    onOpen={(p) => openPhotoIn(photos, p)}
                  />
                </>
              )}

              {tab === "collections" && !album && (
                <>
                  <StickyHeader
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
                  <div className="top-head sticky glass album-sticky">
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
            </main>

            {tab === "library" && !album && (
              <ScrollDateBubble containerRef={contentRef} />
            )}

            {tab === "library" && !album && (
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

            <BottomBar
              active={tab}
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
            onIndexChange={setViewerIndex}
            onClose={() => setViewerIndex(null)}
            onToggleFavorite={toggleFavorite}
            onDelete={removePhoto}
            onSetCity={setCity}
            onUpdatePhoto={updatePhoto}
          />
        )}

        {searchOpen && (
          <SearchScreen
            photos={photos}
            onOpen={(p) => {
              setSearchOpen(false);
              openPhotoIn(photos, p);
            }}
            onClose={() => setSearchOpen(false)}
          />
        )}

        {addAlbumOpen && (
          <AddToAlbumScreen
            photos={photos}
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
        {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      </div>
    </div>
  );
}

function StickyHeader({
  title,
  user,
  onAvatar,
}: {
  title: string;
  user: UserProfile;
  onAvatar: () => void;
}) {
  return (
    <div className="top-head sticky glass">
      <h1 className="big-title">{title}</h1>
      <Avatar user={user} size={34} onClick={onAvatar} />
    </div>
  );
}
