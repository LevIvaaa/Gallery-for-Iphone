import { useEffect, useRef, useState } from "react";
import type { Photo } from "../types";
import { groupByDay } from "../lib/format";
import { getThumbSrc } from "../services/photoLibrary";
import { HeartIcon, CheckIcon } from "../icons";

type Observe = (el: Element, cb: () => void) => () => void;

function Cell({
  p,
  observe,
  selecting,
  selected,
  onOpen,
  onToggleSelect,
  onLongPress,
}: {
  p: Photo;
  observe: Observe;
  selecting?: boolean;
  selected?: boolean;
  onOpen: (p: Photo) => void;
  onToggleSelect?: (p: Photo) => void;
  onLongPress?: (p: Photo) => void;
}) {
  const [src, setSrc] = useState(p.thumb || "");
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const longFired = useRef(false);

  // Ленивая подгрузка миниатюры для нативных фото
  useEffect(() => {
    if (p.thumb) {
      setSrc(p.thumb);
      return;
    }
    if (!p.identifier || !ref.current) return;
    let cancelled = false;
    const stop = observe(ref.current, () => {
      getThumbSrc(p.identifier!, 256)
        .then((s) => !cancelled && s && setSrc(s))
        .catch(() => {});
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [p.id, p.thumb, p.identifier, observe]);

  const down = () => {
    longFired.current = false;
    timer.current = window.setTimeout(() => {
      longFired.current = true;
      onLongPress?.(p);
    }, 450);
  };
  const cancel = () => window.clearTimeout(timer.current);
  const click = () => {
    if (longFired.current) return;
    if (selecting) onToggleSelect?.(p);
    else onOpen(p);
  };

  return (
    <button
      ref={ref}
      className={`photo-cell ${selecting ? "selecting" : ""} ${selected ? "selected" : ""}`}
      onClick={click}
      onPointerDown={down}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerMove={cancel}
    >
      {src && <img src={src} alt={p.caption ?? ""} draggable={false} />}
      {p.favorite && !selecting && (
        <span className="cell-fav">
          <HeartIcon size={14} filled />
        </span>
      )}
      {selecting && (
        <span className={`cell-check ${selected ? "on" : ""}`}>
          {selected && <CheckIcon size={14} />}
        </span>
      )}
    </button>
  );
}

export function PhotoGrid({
  photos,
  columns,
  grouped,
  selecting,
  selected,
  onOpen,
  onToggleSelect,
  onLongPress,
}: {
  photos: Photo[];
  columns: number;
  grouped?: boolean;
  selecting?: boolean;
  selected?: Set<string>;
  onOpen: (p: Photo) => void;
  onToggleSelect?: (p: Photo) => void;
  onLongPress?: (p: Photo) => void;
}) {
  // Общий наблюдатель для ленивой загрузки превью
  const ioRef = useRef<IntersectionObserver | null>(null);
  const cbs = useRef(new Map<Element, () => void>());
  useEffect(() => {
    ioRef.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const cb = cbs.current.get(e.target);
            if (cb) cb();
          }
        }
      },
      { rootMargin: "600px" }
    );
    return () => ioRef.current?.disconnect();
  }, []);
  const observe: Observe = (el, cb) => {
    cbs.current.set(el, () => {
      cb();
      ioRef.current?.unobserve(el);
      cbs.current.delete(el);
    });
    ioRef.current?.observe(el);
    return () => {
      ioRef.current?.unobserve(el);
      cbs.current.delete(el);
    };
  };

  const cols = { gridTemplateColumns: `repeat(${columns}, 1fr)` };
  const cell = (p: Photo) => (
    <Cell
      key={p.id}
      p={p}
      observe={observe}
      selecting={selecting}
      selected={selected?.has(p.id)}
      onOpen={onOpen}
      onToggleSelect={onToggleSelect}
      onLongPress={onLongPress}
    />
  );

  if (grouped) {
    return (
      <div className="photo-grid-wrap">
        {groupByDay(photos).map((g) => (
          <section key={g.key} className="photo-section">
            <h2 className="section-title">{g.label}</h2>
            <div className="photo-grid" style={cols}>
              {g.items.map(cell)}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="photo-grid-wrap">
      <div className="photo-grid" style={cols}>
        {photos.map(cell)}
      </div>
    </div>
  );
}
