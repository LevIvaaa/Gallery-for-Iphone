import { useMemo, useState } from "react";
import type { Photo, UserAlbum, MediaKind } from "../types";
import {
  HeartIcon,
  VideoIcon,
  LiveIcon,
  PersonIcon,
  CropIcon,
  LockIcon,
  TrashIcon,
  PlusIcon,
  GridIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlayIcon,
} from "../icons";

export interface OpenCollection {
  title: string;
  photos: Photo[];
  locked?: boolean;
  emptyHint?: string;
}

const kindOf = (photos: Photo[], k: MediaKind) =>
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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  const byId = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);
  const visible = photos.filter((p) => !p.hidden);

  const favorites = visible.filter((p) => p.favorite);
  const recentSaved = [...visible].sort(
    (a, b) => (b.addedDate?.getTime() ?? 0) - (a.addedDate?.getTime() ?? 0)
  );
  const screenshots = kindOf(visible, "screenshot");
  const screenrecs = kindOf(visible, "screenrec");
  const videos = kindOf(visible, "video");
  const live = kindOf(visible, "live");
  const selfies = kindOf(visible, "selfie");
  const hidden = photos.filter((p) => p.hidden);

  const cities = useMemo(() => {
    const m = new Map<string, Photo[]>();
    for (const p of visible) {
      if (!p.city) continue;
      const a = m.get(p.city) ?? [];
      a.push(p);
      m.set(p.city, a);
    }
    return Array.from(m, ([title, items]) => ({ title, items }));
  }, [photos]);

  // Воспоминания: избранное + поездки по городам
  const memories: OpenCollection[] = [
    { title: "Избранные моменты", photos: favorites.length ? favorites : visible.slice(0, 10) },
    ...cities.map((c) => ({ title: c.title, photos: c.items })),
  ];

  const pinned: OpenCollection[] = [
    { title: "Избранное", photos: favorites },
    { title: "Сохранены недавно", photos: recentSaved },
    { title: "Снимки экрана", photos: screenshots },
    { title: "Видео", photos: videos },
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
      c: { title: "Скрытые", photos: hidden, locked: true, emptyHint: "Доступ по Face ID. Скрытых фото нет." },
      Icon: LockIcon,
    },
    {
      c: { title: "Недавно удалённые", photos: [], locked: true, emptyHint: "Удалённые фото хранятся 30 дней." },
      Icon: TrashIcon,
    },
  ];

  const Section = ({
    title,
    sectionKey,
    extra,
    children,
  }: {
    title: string;
    sectionKey: string;
    extra?: React.ReactNode;
    children: React.ReactNode;
  }) => {
    const isOpen = !collapsed.has(sectionKey);
    return (
      <section className="col-section">
        <div className="col-head">
          <button className="col-title" onClick={() => onOpen({ title, photos: visible })}>
            <span>{title}</span>
            <ChevronRightIcon size={20} />
          </button>
          <div className="col-head-actions">
            {extra}
            <button
              className="collapse-btn"
              onClick={() => toggle(sectionKey)}
              aria-label="Свернуть"
            >
              <ChevronDownIcon
                size={18}
                className={isOpen ? "" : "rot"}
              />
            </button>
          </div>
        </div>
        {isOpen && children}
      </section>
    );
  };

  return (
    <div className="collections">
      {/* Воспоминания — большие карточки */}
      {memories.length > 0 && (
        <Section title="Воспоминания" sectionKey="memories">
          <div className="mem-row">
            {memories.map((m) => (
              <button key={m.title} className="mem-card" onClick={() => onOpen(m)}>
                <img src={m.photos[0]?.thumb} alt={m.title} draggable={false} />
                <span className="mem-grad" />
                <PlayIcon size={34} className="mem-play" />
                <span className="mem-title">{m.title}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Закреплённые — горизонтальные карточки */}
      {pinned.length > 0 && (
        <Section title="Закреплённые" sectionKey="pinned">
          <div className="pinned-row">
            {pinned.map((c) => (
              <button key={c.title} className="pinned-card" onClick={() => onOpen(c)}>
                <div className="pinned-cover">
                  <img src={c.photos[0].thumb} alt={c.title} draggable={false} />
                  {c.title === "Избранное" && (
                    <HeartIcon size={16} filled className="pin-heart" />
                  )}
                  <span className="pinned-overlay">
                    <strong>{c.title}</strong>
                    <small>{c.photos.length}</small>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Альбомы — сетка + создание + переключатель размера */}
      <Section
        title="Альбомы"
        sectionKey="albums"
        extra={
          <button
            className="collapse-btn"
            onClick={() => onColumns(columns >= 4 ? 2 : columns + 1)}
            aria-label="Размер сетки"
          >
            <GridIcon size={17} />
          </button>
        }
      >
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
      </Section>

      {/* Поездки */}
      {cities.length > 0 && (
        <Section title="Поездки" sectionKey="trips">
          <div className="pinned-row">
            {cities.map((c) => (
              <button
                key={c.title}
                className="pinned-card"
                onClick={() => onOpen({ title: c.title, photos: c.items })}
              >
                <div className="pinned-cover">
                  <img src={c.items[0].thumb} alt={c.title} draggable={false} />
                  <span className="pinned-overlay">
                    <strong>{c.title}</strong>
                    <small>{c.items.length}</small>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Типы медиафайлов */}
      <Section title="Типы медиафайлов" sectionKey="types">
        <div className="list-group glass">
          {mediaTypes.map(({ c, Icon }, i) => (
            <button key={c.title} className={`list-row ${i ? "div" : ""}`} onClick={() => onOpen(c)}>
              <span className="list-ico accent">
                <Icon size={20} />
              </span>
              <span className="list-label">{c.title}</span>
              <span className="list-count">{c.photos.length}</span>
              <ChevronRightIcon size={16} className="row-chevron" />
            </button>
          ))}
        </div>
      </Section>

      {/* Другое */}
      <Section title="Другое" sectionKey="other">
        <div className="list-group glass">
          {other.map(({ c, Icon }, i) => (
            <button key={c.title} className={`list-row ${i ? "div" : ""}`} onClick={() => onOpen(c)}>
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
      </Section>
    </div>
  );
}
