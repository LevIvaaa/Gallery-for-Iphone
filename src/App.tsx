import { useEffect, useMemo, useRef, useState, ChangeEvent } from "react";
import { BottomBar, Tab } from "./components/BottomBar";
import { PhotoGrid } from "./components/PhotoGrid";
import { PhotoViewer } from "./components/PhotoViewer";
import { Editor } from "./components/Editor";
import { PermissionScreen } from "./components/PermissionScreen";
import { Avatar, AvatarMenu, UserProfile } from "./components/AvatarMenu";
import { AvatarScreen } from "./components/AvatarScreen";
import { SettingsSheet, Settings, DEFAULT_SETTINGS } from "./components/SettingsSheet";
import { Collections, OpenCollection } from "./components/Collections";
import { AddToAlbumScreen } from "./components/AddToAlbumScreen";
import { FilterMenu, FilterKey } from "./components/FilterMenu";
import { CollectionsMenu } from "./components/CollectionsMenu";
import { ContextMenu } from "./components/ContextMenu";
import { SelectionBar } from "./components/SelectionBar";
import { ConfirmSheet } from "./components/ConfirmSheet";
import { ActionMenu } from "./components/ActionMenu";
import { AlbumPickerSheet } from "./components/EditSheets";
import { usePhotoLibrary } from "./hooks/usePhotoLibrary";
import { deleteManyFromDevice } from "./services/nativeDelete";
import { verifyBiometric } from "./services/biometric";
import { sharePhoto } from "./lib/share";
import { haptic } from "./lib/haptics";
import { objectsCount, monthYearLabel } from "./lib/format";
import { LockIcon, CheckIcon, FilterIcon, DotsIcon, HeartIcon, AlbumsIcon } from "./icons";
import type { Photo, UserAlbum } from "./types";

const user: UserProfile = { name: "Lev Iva", subtitle: "Apple ID · iCloud+" };

const segments = [
  { key: "years", label: "Годы", cols: 5 },
  { key: "months", label: "Месяцы", cols: 4 },
  { key: "all", label: "Все", cols: 3 },
];

interface OpenAlbum {
  title: string;
  photos: Photo[];
  hint?: string;
  trash?: boolean;
  hiddenAlbum?: boolean;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

function applyFilter(list: Photo[], k: FilterKey): Photo[] {
  switch (k) {
    case "fav": return list.filter((p) => p.favorite);
    case "photo": return list.filter((p) => p.kind === "photo");
    case "video": return list.filter((p) => p.kind === "video");
    case "live": return list.filter((p) => p.kind === "live");
    case "selfie": return list.filter((p) => p.kind === "selfie");
    case "screenshot": return list.filter((p) => p.kind === "screenshot");
    default: return list;
  }
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
    toggleHidden,
    purgePhoto,
    restorePhoto,
  } = usePhotoLibrary();

  const [tab, setTab] = useState<Tab>("library");
  const [libCols, setLibCols] = useState(3);
  const [colCols, setColCols] = useState(2);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [album, setAlbum] = useState<OpenAlbum | null>(null);
  const [albums, setAlbums] = useState<UserAlbum[]>([]);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addAlbumOpen, setAddAlbumOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const s = localStorage.getItem("gallery-settings");
      return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [segVisible, setSegVisible] = useState(false);
  const [libSubtitle, setLibSubtitle] = useState("");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [selectMenuOpen, setSelectMenuOpen] = useState(false);
  const [colCollapsed, setColCollapsed] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contextPhoto, setContextPhoto] = useState<Photo | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    ids: string[];
    hard?: boolean;
  } | null>(null);
  const [albumPickerFor, setAlbumPickerFor] = useState<string[] | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    kind: "hide" | "unhide" | "restore";
    ids: string[];
  } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem("gallery-avatar") || undefined;
    } catch {
      return undefined;
    }
  });
  const [avatarEditSrc, setAvatarEditSrc] = useState<string | null>(null);
  const [avatarViewOpen, setAvatarViewOpen] = useState(false);

  const contentRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrolledRef = useRef(false);
  const libColsRef = useRef(libCols);
  libColsRef.current = libCols;
  const albumRef = useRef(album);
  albumRef.current = album;

  const profile: UserProfile = { ...user, avatar: avatarUrl };

  const pickAvatar = () => {
    fileRef.current?.click();
  };
  const onAvatarFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarEditSrc(String(reader.result));
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const visiblePhotos = useMemo(
    () => photos.filter((p) => !p.hidden && !p.deleted),
    [photos]
  );
  // Старое сверху, новое снизу (как в iOS) — открываемся в самом низу
  const libraryPhotos = useMemo(
    () =>
      [...applyFilter(visiblePhotos, filterKey)].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      ),
    [visiblePhotos, filterKey]
  );
  const byId = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);
  const viewerList = album ? album.photos : libraryPhotos;

  useEffect(() => {
    if (viewerIndex === null) return;
    if (viewerList.length === 0) setViewerIndex(null);
    else if (viewerIndex > viewerList.length - 1)
      setViewerIndex(viewerList.length - 1);
  }, [viewerList, viewerIndex]);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el || tab !== "library" || album || selecting) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atTop = scrollTop < 12;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 12;
    setSegVisible(!atTop && !atBottom);
    if (atTop) {
      setLibSubtitle(objectsCount(libraryPhotos.length));
    } else {
      const cell = el.clientWidth / libCols;
      const idx = clamp(Math.floor(scrollTop / cell) * libCols, 0, libraryPhotos.length - 1);
      const ph = libraryPhotos[idx];
      if (ph) setLibSubtitle(monthYearLabel(ph.date));
    }
  };

  useEffect(() => {
    if (tab !== "library" || album) setSegVisible(false);
  }, [tab, album]);

  useEffect(() => {
    setLibSubtitle(objectsCount(libraryPhotos.length));
  }, [libraryPhotos.length]);

  useEffect(() => {
    const el = document.documentElement;
    if (settings.theme === "system") delete el.dataset.theme;
    else el.dataset.theme = settings.theme;
  }, [settings.theme]);

  // Сохранение настроек (включая тему) между сессиями
  useEffect(() => {
    try {
      localStorage.setItem("gallery-settings", JSON.stringify(settings));
    } catch {
      /* недоступно */
    }
  }, [settings]);

  // Сохранение аватарки между сессиями
  useEffect(() => {
    try {
      if (avatarUrl) localStorage.setItem("gallery-avatar", avatarUrl);
      else localStorage.removeItem("gallery-avatar");
    } catch {
      /* недоступно */
    }
  }, [avatarUrl]);

  // Открываемся в самом низу медиатеки (свежие фото внизу)
  useEffect(() => {
    if (tab !== "library") {
      scrolledRef.current = false;
      return;
    }
    if (album || selecting || !libraryPhotos.length || scrolledRef.current) return;
    const el = contentRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      scrolledRef.current = true;
    }
  }, [tab, album, selecting, libraryPhotos.length]);

  // Назад из подраздела: свайп от левого края (как жест iPhone) + Esc
  useEffect(() => {
    const el = contentRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && albumRef.current) setAlbum(null);
    };
    window.addEventListener("keydown", onKey);
    let sx = 0;
    let sy = 0;
    let edge = false;
    const ts = (e: TouchEvent) => {
      const t = e.touches[0];
      sx = t.clientX;
      sy = t.clientY;
      edge = sx < 30 && !!albumRef.current;
    };
    const tm = (e: TouchEvent) => {
      if (!edge) return;
      const t = e.touches[0];
      if (t.clientX - sx > 70 && Math.abs(t.clientY - sy) < 60) {
        edge = false;
        setAlbum(null);
      }
    };
    el?.addEventListener("touchstart", ts, { passive: true });
    el?.addEventListener("touchmove", tm, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      el?.removeEventListener("touchstart", ts);
      el?.removeEventListener("touchmove", tm);
    };
  }, []);

  // Пинч-зум сетки
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
        setLibCols(clamp(startCols - Math.round((ratio - 1) * 4), 2, 6));
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

  const createAlbum = (name: string, ids: string[]) => {
    setAlbums((prev) => [...prev, { id: `al-${Date.now()}`, title: name, photoIds: ids }]);
    setAddAlbumOpen(false);
  };

  const SECTION_KEYS = ["memories", "pinned", "albums", "trips", "types", "other"];
  const toggleColCollapse = (k: string) =>
    setColCollapsed((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const favoriteSelected = () => {
    [...selected].forEach(toggleFavorite);
    setSelectMenuOpen(false);
    exitSelection();
  };
  const hideSelected = () => {
    setSelectMenuOpen(false);
    setPendingConfirm({ kind: "hide", ids: [...selected] });
  };
  const addAlbumSelected = () => {
    setSelectMenuOpen(false);
    setAlbumPickerFor([...selected]);
  };

  // ===== Выбор фото =====
  const toggleSelect = (p: Photo) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(p.id) ? n.delete(p.id) : n.add(p.id);
      return n;
    });
  const enterSelection = (p?: Photo) => {
    setSelecting(true);
    setSelected(new Set(p ? [p.id] : []));
    setSegVisible(false);
  };
  const exitSelection = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const shareSelected = () => {
    const first = photos.find((p) => selected.has(p.id));
    if (first) sharePhoto(first).catch(() => {});
  };
  const restoreSelected = () =>
    setPendingConfirm({
      kind: album?.trash ? "restore" : "unhide",
      ids: [...selected],
    });

  const doConfirmAction = () => {
    if (!pendingConfirm) return;
    const { kind, ids } = pendingConfirm;
    if (kind === "restore") ids.forEach(restorePhoto);
    else ids.forEach(toggleHidden); // hide / unhide
    setAlbum((a) =>
      a ? { ...a, photos: a.photos.filter((p) => !ids.includes(p.id)) } : a
    );
    setPendingConfirm(null);
    exitSelection();
  };

  const addToAlbumIds = (albumId: string, ids: string[]) =>
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === albumId
          ? { ...a, photoIds: Array.from(new Set([...a.photoIds, ...ids])) }
          : a
      )
    );

  const photoAction = (kind: string, p: Photo) => {
    switch (kind) {
      case "share":
        sharePhoto(p).catch(() => {});
        break;
      case "favorite":
        toggleFavorite(p.id);
        break;
      case "copy":
        try {
          navigator.clipboard?.writeText(p.full || p.thumb);
        } catch {
          /* clipboard unavailable */
        }
        break;
      case "hide":
        setPendingConfirm({ kind: p.hidden ? "unhide" : "hide", ids: [p.id] });
        break;
      case "album":
        setAlbumPickerFor([p.id]);
        break;
      case "select":
        enterSelection(p);
        break;
      case "delete":
        setPendingDelete({ ids: [p.id], hard: !!p.deleted });
        break;
    }
  };

  const performDelete = async (ids: string[], hard?: boolean) => {
    setPendingDelete(null);
    haptic("heavy");
    const idents = ids
      .map((id) => byId.get(id)?.identifier)
      .filter(Boolean) as string[];
    await deleteManyFromDevice(idents);
    ids.forEach((id) => (hard ? purgePhoto(id) : removePhoto(id)));
    // обновляем открытый альбом (снимок), чтобы фото исчезли сразу
    setAlbum((a) =>
      a ? { ...a, photos: a.photos.filter((p) => !ids.includes(p.id)) } : a
    );
    exitSelection();
  };

  const needPermission = permission === "prompt" || permission === "denied";
  const collapseTabs = tab === "library" && !album && segVisible && !selecting;

  return (
    <div className="phone">
      <div className="screen">
        {needPermission ? (
          <PermissionScreen state={permission} loading={loading} onRequest={requestAndLoad} />
        ) : (
          <>
            <main className="content" ref={contentRef} onScroll={handleScroll}>
              <div className="view" key={`${tab}${album ? "-album" : ""}`}>
                {tab === "library" && !album && (
                  <>
                    <Header
                      title="Медиатека"
                      subtitle={libSubtitle}
                      user={profile}
                      onAvatar={() => setAvatarOpen(true)}
                      action={
                        <button
                          className={`head-circle ${filterKey !== "all" ? "active" : ""}`}
                          onClick={() => setFilterOpen(true)}
                          aria-label="Фильтр"
                        >
                          <FilterIcon size={20} />
                        </button>
                      }
                      selecting={selecting}
                      selectedCount={selected.size}
                      onDone={exitSelection}
                      onSelectMenu={() => setSelectMenuOpen(true)}
                      onFilter={() => setFilterOpen(true)}
                      filterActive={filterKey !== "all"}
                    />
                    <PhotoGrid
                      photos={libraryPhotos}
                      columns={libCols}
                      grouped={settings.gridByDays}
                      selecting={selecting}
                      selected={selected}
                      onOpen={(p) => openPhotoIn(libraryPhotos, p)}
                      onToggleSelect={toggleSelect}
                      onLongPress={(p) => setContextPhoto(p)}
                    />
                  </>
                )}

                {tab === "collections" && !album && (
                  <>
                    <Header
                      title="Коллекции"
                      user={profile}
                      onAvatar={() => setAvatarOpen(true)}
                      action={
                        <button
                          className="head-circle"
                          onClick={() => setColMenuOpen(true)}
                          aria-label="Опции"
                        >
                          <DotsIcon size={20} />
                        </button>
                      }
                    />
                    <Collections
                      photos={photos}
                      albums={albums}
                      columns={colCols}
                      collapsed={colCollapsed}
                      onToggleCollapse={toggleColCollapse}
                      onOpen={async (c: OpenCollection) => {
                        if (c.title === "Скрытые") {
                          const ok = await verifyBiometric("Доступ к скрытым фото");
                          if (!ok) return;
                        }
                        setAlbum({
                          title: c.title,
                          photos: c.photos,
                          hint: c.emptyHint,
                          trash: c.title === "Недавно удалённые",
                          hiddenAlbum: c.title === "Скрытые",
                        });
                      }}
                      onCreateAlbum={() => setAddAlbumOpen(true)}
                    />
                  </>
                )}

                {album && (
                  <>
                    {selecting ? (
                      <div className="top-head sticky scrim">
                        <div className="head-titles">
                          <h1 className="big-title small">
                            {selected.size ? `Выбрано: ${selected.size}` : "Выберите фото"}
                          </h1>
                        </div>
                        <button className="done-circle" onClick={exitSelection} aria-label="Готово">
                          <CheckIcon size={20} />
                        </button>
                      </div>
                    ) : (
                      <div className="top-head sticky scrim">
                        <div className="head-titles">
                          <h1 className="big-title">{album.title}</h1>
                        </div>
                      </div>
                    )}
                    {album.photos.length ? (
                      <PhotoGrid
                        photos={album.photos}
                        columns={colCols + 1}
                        selecting={selecting}
                        selected={selected}
                        onOpen={(p) => openPhotoIn(album.photos, p, true)}
                        onToggleSelect={toggleSelect}
                        onLongPress={(p) => setContextPhoto(p)}
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

            {tab === "library" && !album && !selecting && (
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

            {selecting ? (
              <SelectionBar
                count={selected.size}
                mode={album?.trash ? "trash" : album?.hiddenAlbum ? "hidden" : undefined}
                onShare={shareSelected}
                onRestore={restoreSelected}
                onDelete={() =>
                  selected.size &&
                  setPendingDelete({ ids: [...selected], hard: !!album?.trash })
                }
              />
            ) : !album ? (
              <BottomBar
                active={tab}
                collapsed={collapseTabs}
                onChange={(t) => {
                  setTab(t);
                  setAlbum(null);
                }}
              />
            ) : null}
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
            onAction={photoAction}
          />
        )}

        {filterOpen && (
          <FilterMenu active={filterKey} onSelect={setFilterKey} onClose={() => setFilterOpen(false)} />
        )}

        {colMenuOpen && (
          <CollectionsMenu
            columns={colCols}
            onColumns={setColCols}
            onCollapseAll={() => setColCollapsed(new Set(SECTION_KEYS))}
            onExpandAll={() => setColCollapsed(new Set())}
            onClose={() => setColMenuOpen(false)}
          />
        )}

        {selectMenuOpen && (
          <ActionMenu
            items={[
              { key: "favorite", label: "В избранное", icon: <HeartIcon size={20} /> },
              { key: "hide", label: "Скрыть", icon: <LockIcon size={20} /> },
              { key: "album", label: "Добавить в альбом", icon: <AlbumsIcon size={20} /> },
            ]}
            onAction={(k) => {
              if (k === "favorite") favoriteSelected();
              else if (k === "hide") hideSelected();
              else if (k === "album") addAlbumSelected();
            }}
            onClose={() => setSelectMenuOpen(false)}
          />
        )}

        {albumPickerFor && (
          <AlbumPickerSheet
            albums={albums}
            onPick={(id) => addToAlbumIds(id, albumPickerFor)}
            onCreate={() => setAddAlbumOpen(true)}
            onClose={() => setAlbumPickerFor(null)}
          />
        )}
        {pendingConfirm && (
          <ConfirmSheet
            title={
              pendingConfirm.kind === "restore"
                ? pendingConfirm.ids.length > 1
                  ? `Восстановить ${pendingConfirm.ids.length} фото?`
                  : "Восстановить фото?"
                : pendingConfirm.kind === "unhide"
                  ? "Убрать из скрытых?"
                  : pendingConfirm.ids.length > 1
                    ? `Скрыть ${pendingConfirm.ids.length} фото?`
                    : "Скрыть фото?"
            }
            confirmLabel={
              pendingConfirm.kind === "restore"
                ? "Восстановить"
                : pendingConfirm.kind === "unhide"
                  ? "Показать"
                  : "Скрыть"
            }
            onConfirm={doConfirmAction}
            onCancel={() => setPendingConfirm(null)}
          />
        )}

        {contextPhoto && (
          <ContextMenu
            photo={contextPhoto}
            onShare={() => photoAction("share", contextPhoto)}
            onFavorite={() => photoAction("favorite", contextPhoto)}
            onCopy={() => photoAction("copy", contextPhoto)}
            onSelect={() => photoAction("select", contextPhoto)}
            onHide={() => photoAction("hide", contextPhoto)}
            onAddAlbum={() => photoAction("album", contextPhoto)}
            onDelete={() => photoAction("delete", contextPhoto)}
            onClose={() => setContextPhoto(null)}
          />
        )}

        {pendingDelete && (
          <ConfirmSheet
            title={
              pendingDelete.ids.length > 1
                ? `Удалить ${pendingDelete.ids.length} фото?`
                : "Удалить фото?"
            }
            message={
              pendingDelete.hard
                ? "Фото будет удалено навсегда."
                : "Будет удалено с устройства и из iCloud."
            }
            confirmLabel={pendingDelete.hard ? "Удалить навсегда" : "Удалить"}
            destructive
            onConfirm={() => performDelete(pendingDelete.ids, pendingDelete.hard)}
            onCancel={() => setPendingDelete(null)}
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
            user={profile}
            onClose={() => setAvatarOpen(false)}
            onViewAvatar={() => {
              setAvatarOpen(false);
              setAvatarViewOpen(true);
            }}
            onOpenSettings={() => {
              setAvatarOpen(false);
              setSettingsOpen(true);
            }}
          />
        )}

        {avatarViewOpen && (
          <AvatarScreen
            avatar={avatarUrl}
            initials={user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            onCrop={() => {
              if (avatarUrl) setAvatarEditSrc(avatarUrl);
            }}
            onReplace={pickAvatar}
            onRemove={() => {
              setAvatarUrl(undefined);
              setAvatarViewOpen(false);
            }}
            onClose={() => setAvatarViewOpen(false)}
          />
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onAvatarFile}
        />
        {avatarEditSrc && (
          <Editor
            circleCrop
            photo={{
              id: "avatar",
              thumb: avatarEditSrc,
              full: avatarEditSrc,
              favorite: false,
              kind: "photo",
              date: new Date(),
              source: "demo",
            }}
            onCancel={() => setAvatarEditSrc(null)}
            onSave={(url) => {
              setAvatarUrl(url);
              setAvatarEditSrc(null);
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
  action,
  selecting,
  selectedCount = 0,
  onDone,
  onSelectMenu,
  onFilter,
  filterActive,
}: {
  title: string;
  subtitle?: string;
  user: UserProfile;
  onAvatar: () => void;
  action?: React.ReactNode;
  selecting?: boolean;
  selectedCount?: number;
  onDone?: () => void;
  onSelectMenu?: () => void;
  onFilter?: () => void;
  filterActive?: boolean;
}) {
  if (selecting) {
    return (
      <div className="top-head sticky scrim">
        <div className="head-titles">
          <h1 className="big-title">
            {selectedCount ? `Выбрано: ${selectedCount}` : "Выберите фото"}
          </h1>
        </div>
        <div className="head-acts">
          {(onFilter || onSelectMenu) && (
            <div className="head-pill glass">
              {onFilter && (
                <button
                  className={`pill-btn ${filterActive ? "active" : ""}`}
                  onClick={onFilter}
                  aria-label="Фильтр"
                >
                  <FilterIcon size={19} />
                </button>
              )}
              {onSelectMenu && (
                <button className="pill-btn" onClick={onSelectMenu} aria-label="Ещё">
                  <DotsIcon size={19} />
                </button>
              )}
            </div>
          )}
          <button className="done-circle" onClick={onDone} aria-label="Готово">
            <CheckIcon size={20} />
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="top-head sticky scrim">
      <div className="head-titles">
        <h1 className="big-title">{title}</h1>
        {subtitle && <p className="head-sub">{subtitle}</p>}
      </div>
      <div className="head-acts">
        {action}
        <Avatar user={user} size={34} onClick={onAvatar} />
      </div>
    </div>
  );
}
