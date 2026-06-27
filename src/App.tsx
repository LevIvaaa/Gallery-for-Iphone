import { useMemo, useState } from "react";
import { StatusBar } from "./components/StatusBar";
import { TabBar, Tab } from "./components/TabBar";
import { PhotoGrid } from "./components/PhotoGrid";
import { PhotoViewer } from "./components/PhotoViewer";
import { photos as initialPhotos, Photo, thumbUrl } from "./data/photos";
import { SearchIcon } from "./icons";

const segments = [
  { key: "years", label: "Годы", cols: 5 },
  { key: "months", label: "Месяцы", cols: 4 },
  { key: "all", label: "Все", cols: 3 },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("library");
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [seg, setSeg] = useState("all");
  const [openId, setOpenId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const columns = segments.find((s) => s.key === seg)?.cols ?? 3;
  const openPhoto = photos.find((p) => p.id === openId) ?? null;

  const toggleFavorite = (id: number) =>
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );

  const searchResults = useMemo(
    () =>
      query.trim()
        ? photos.filter((p) =>
            p.caption.toLowerCase().includes(query.trim().toLowerCase())
          )
        : photos,
    [query, photos]
  );

  const favorites = photos.filter((p) => p.favorite);

  return (
    <div className="phone">
      <div className="screen">
        <StatusBar />

        <main className="content">
          {tab === "library" && (
            <>
              <div className="top-head">
                <h1 className="big-title">Медиатека</h1>
              </div>
              <PhotoGrid photos={photos} columns={columns} onOpen={(p) => setOpenId(p.id)} />
            </>
          )}

          {tab === "albums" && (
            <>
              <div className="top-head">
                <h1 className="big-title">Альбомы</h1>
              </div>
              <div className="albums">
                <AlbumCard title="Избранное" items={favorites} onOpen={(p) => setOpenId(p.id)} />
                <AlbumCard title="Недавние" items={photos.slice(0, 6)} onOpen={(p) => setOpenId(p.id)} />
                <AlbumCard title="Все фото" items={photos.slice(6, 12)} onOpen={(p) => setOpenId(p.id)} />
              </div>
            </>
          )}

          {tab === "search" && (
            <>
              <div className="top-head">
                <h1 className="big-title">Поиск</h1>
                <div className="search-field glass">
                  <SearchIcon size={20} />
                  <input
                    placeholder="Фото, места, моменты"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <PhotoGrid photos={searchResults} columns={3} onOpen={(p) => setOpenId(p.id)} />
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

        <TabBar active={tab} onChange={setTab} />

        {openPhoto && (
          <PhotoViewer
            photo={openPhoto}
            onClose={() => setOpenId(null)}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </div>
    </div>
  );
}

function AlbumCard({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: Photo[];
  onOpen: (p: Photo) => void;
}) {
  const cover = items[0];
  return (
    <button className="album-card" onClick={() => cover && onOpen(cover)}>
      <div className="album-cover">
        {cover ? (
          <img src={thumbUrl(cover, 400)} alt={title} draggable={false} />
        ) : (
          <div className="album-empty" />
        )}
      </div>
      <div className="album-info">
        <span className="album-title">{title}</span>
        <span className="album-count">{items.length}</span>
      </div>
    </button>
  );
}
