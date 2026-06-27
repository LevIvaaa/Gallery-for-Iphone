import { useMemo } from "react";
import type { Photo, UserAlbum, MediaKind } from "../types";
import {
  HeartIcon,
  VideoIcon,
  LiveIcon,
  PersonIcon,
  CropIcon,
  PinIcon,
  MapPinIcon,
  SparklesIcon,
  LockIcon,
  TrashIcon,
  PlusIcon,
  GridIcon,
  ChevronRightIcon,
} from "../icons";

export interface OpenCollection {
  title: string;
  photos: Photo[];
  locked?: boolean;
  emptyHint?: string;
}

const kindCount = (photos: Photo[], k: MediaKind) =>
  photos.filter((p) => p.kind === k);

export function Collections({
  photos,
  albums,
  columns,
  onColumns,
  onOpen,
  onCreateAlbum,
}: {
  photos: Photo[];
  albums: UserAlbum[];
  columns: number;
  onColumns: (n: number) => void;
  onOpen: (c: OpenCollection) => void;
  onCreateAlbum: () => void;
}) {
  const byId = useMemo(
    () => new Map(photos.map((p) => [p.id, p])),
    [photos]
  );

  const favorites = photos.filter((p) => p.favorite);
  const recentSaved = [...photos].sort(
    (a, b) => (b.addedDate?.getTime() ?? 0) - (a.addedDate?.getTime() ?? 0)
  );
  const screenshots = kindCount(photos, "screenshot");
  const screenrecs = kindCount(photos, "screenrec");
  const videos = kindCount(photos, "video");
  const live = kindCount(photos, "live");
  const selfies = kindCount(photos, "selfie");
  const trips = photos.filter((p) => p.city);
  const hidden = photos.filter((p) => p.hidden);

  const cities = useMemo(() => {
    const m = new Map<string, Photo[]>();
    for (const p of photos) {
      if (!p.city) continue;
      const a = m.get(p.city) ?? [];
      a.push(p);
      m.set(p.city, a);
    }
    return Array.from(m, ([title, items]) => ({ title, items }));
  }, [photos]);

  const pinned: OpenCollection[] = [
    { title: "Избранное", photos: favorites },
    { title: "Недавно сохранённое", photos: recentSaved },
    { title: "Воспоминания", photos: favorites.length ? favorites : photos.slice(0, 8) },
    { title: "Поездки", photos: trips },
  ].filter((c) => c.photos.length);

  const mediaTypes: { c: OpenCollection; Icon: typeof VideoIcon }[] = [
    { c: { title: "Видео", photos: videos }, Icon: VideoIcon },
    { c: { title: "Лайв фото", photos: live }, Icon: LiveIcon },
    { c: { title: "Селфи", photos: selfies }, Icon: PersonIcon },
    { c: { title: "Снимки экрана", photos: screenshots }, Icon: CropIcon },
    { c: { title: "Записи экрана", photos: screenrecs }, Icon: VideoIcon },
  ];

  const other: { c: OpenCollection; Icon: typeof HeartIcon }[] = [
    { c: { title: "Избранное", photos: favorites }, Icon: HeartIcon },
    {
      c: {
        title: "Скрытые",
        photos: hidden,
        locked: true,
        emptyHint: "Доступ по Face ID. Скрытых фото нет.",
      },
      Icon: LockIcon,
    },
    {
      c: {
        title: "Недавно удалённые",
        photos: [],
        locked: true,
        emptyHint: "Удалённые фото хранятся 30 дней.",
      },
      Icon: TrashIcon,
    },
  ];

  return (
    <div className="collections">
      {/* Закреплённые */}
      <SectionTitle title="Закреплённые">
        <PinIcon size={16} className="sec-ico" />
      </SectionTitle>
      <div className="pinned-row">
        {pinned.map((c) => (
          <button key={c.title} className="pinned-card" onClick={() => onOpen(c)}>
            <div className="pinned-cover">
              <img src={c.photos[0].thumb} alt={c.title} draggable={false} />
              <span className="pinned-overlay">
                <strong>{c.title}</strong>
                <small>{c.photos.length}</small>
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Мои альбомы + переключатель сетки */}
      <div className="sec-head">
        <h2 className="section-title bare">Мои альбомы</h2>
        <button
          className="grid-switch"
          onClick={() => onColumns(columns >= 4 ? 2 : columns + 1)}
          aria-label="Размер сетки"
        >
          <GridIcon size={18} />
        </button>
      </div>
      <div className="albums" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        <button className="album-card add-album" onClick={onCreateAlbum}>
          <div className="album-cover add">
            <PlusIcon size={30} />
          </div>
          <div className="album-info">
            <span className="album-title">Новый альбом</span>
          </div>
        </button>
        {albums.map((al) => {
          const items = al.photoIds.map((id) => byId.get(id)).filter(Boolean) as Photo[];
          return (
            <button
              key={al.id}
              className="album-card"
              onClick={() => onOpen({ title: al.title, photos: items, emptyHint: "Альбом пуст." })}
            >
              <div className="album-cover">
                {items[0] ? (
                  <img src={items[0].thumb} alt={al.title} draggable={false} />
                ) : (
                  <div className="album-empty" />
                )}
              </div>
              <div className="album-info">
                <span className="album-title">{al.title}</span>
                <span className="album-count">{items.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Поездки (по городам) */}
      {cities.length > 0 && (
        <>
          <SectionTitle title="Поездки">
            <MapPinIcon size={16} className="sec-ico" />
          </SectionTitle>
          <div className="albums" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {cities.map((c) => (
              <button
                key={c.title}
                className="album-card"
                onClick={() => onOpen({ title: c.title, photos: c.items })}
              >
                <div className="album-cover">
                  <img src={c.items[0].thumb} alt={c.title} draggable={false} />
                </div>
                <div className="album-info">
                  <span className="album-title">{c.title}</span>
                  <span className="album-count">{c.items.length}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Типы медиафайлов */}
      <SectionTitle title="Типы медиафайлов">
        <SparklesIcon size={16} className="sec-ico" />
      </SectionTitle>
      <div className="list-group glass">
        {mediaTypes.map(({ c, Icon }, i) => (
          <button
            key={c.title}
            className={`list-row ${i ? "div" : ""}`}
            onClick={() => onOpen(c)}
          >
            <span className="list-ico accent">
              <Icon size={20} />
            </span>
            <span className="list-label">{c.title}</span>
            <span className="list-count">{c.photos.length}</span>
            <ChevronRightIcon size={16} className="row-chevron" />
          </button>
        ))}
      </div>

      {/* Другое */}
      <SectionTitle title="Другое" />
      <div className="list-group glass">
        {other.map(({ c, Icon }, i) => (
          <button
            key={c.title}
            className={`list-row ${i ? "div" : ""}`}
            onClick={() => onOpen(c)}
          >
            <span className="list-ico">
              <Icon size={20} />
            </span>
            <span className="list-label">{c.title}</span>
            {c.locked && <LockIcon size={15} className="row-chevron" />}
            <span className="list-count">{c.photos.length}</span>
            <ChevronRightIcon size={16} className="row-chevron" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <h2 className="section-title big">
      {title}
      {children}
    </h2>
  );
}
