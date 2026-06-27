import { useEffect, useRef, useState } from "react";

/**
 * Пузырёк с датой текущей секции справа при прокрутке медиатеки —
 * как в стандартной «Галерее» iOS. Показывается во время скролла,
 * прячется через паузу.
 */
export function ScrollDateBubble({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement>;
}) {
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const titles = el.querySelectorAll<HTMLElement>(".section-title");
      const top = el.getBoundingClientRect().top + 70;
      let current = "";
      titles.forEach((t) => {
        if (t.getBoundingClientRect().top <= top) current = t.textContent || "";
      });
      if (!current && titles.length) current = titles[0].textContent || "";
      if (current) {
        setLabel(current);
        setVisible(true);
        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setVisible(false), 900);
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.clearTimeout(hideTimer.current);
    };
  }, [containerRef]);

  if (!label) return null;
  return (
    <div className={`date-bubble glass ${visible ? "show" : ""}`}>{label}</div>
  );
}
