"use client";

import type { ReactNode } from "react";

/** Một cột nhóm (Của công ty / Cộng tác ngoài) — dùng chung cho trang Xe & Nhân sự. */
export default function GroupColumn<T extends { id: string }>({
  title,
  emoji,
  items,
  empty,
  renderItem,
}: {
  title: string;
  emoji: string;
  items: T[];
  empty: string;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 border-b border-hairline pb-3 text-sm font-bold tracking-tight text-ink">
        <span>{emoji}</span>
        {title}
        <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-muted">{items.length}</span>
      </h3>
      {items.length ? (
        <div className="space-y-3">{items.map(renderItem)}</div>
      ) : (
        <div className="rounded-2xl border border-dashed border-hairline p-8 text-center text-sm text-muted">
          {empty}
        </div>
      )}
    </section>
  );
}
