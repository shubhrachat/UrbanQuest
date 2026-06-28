"use client";

import { useStore } from "@/store/useStore";

export default function LiveTicker() {
  const tickerEvents = useStore((s) => s.tickerEvents);
  const issues = useStore((s) => s.issues);

  const items =
    tickerEvents.length > 0
      ? tickerEvents
      : issues.slice(0, 3).map((i) => ({
          id: i.id,
          message: `${i.status.toUpperCase()}: ${i.title} — ${i.zone}`,
          timestamp: i.createdAt,
        }));

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="ticker-wrap fixed bottom-0 left-0 right-0 z-[1050] h-10 flex items-center">
      <div className="bg-olive-dark px-3 h-full flex items-center border-r border-brass z-10">
        <span className="font-stencil text-xs text-amber-glow tracking-widest whitespace-nowrap">
          LIVE FEED
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="ticker-content">
          {doubled.map((item, i) => (
            <span
              key={`${item.id}-${i}`}
              className="font-mono text-[11px] text-parchment/80 px-8 tracking-wide"
            >
              <span className="text-amber-war">{"///"}</span> {item.message}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
