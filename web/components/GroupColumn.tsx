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
      <h3 className="flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-700">
        <span>{emoji}</span>
        {title}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{items.length}</span>
      </h3>
      {items.length ? (
        <div className="space-y-3">{items.map(renderItem)}</div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
          {empty}
        </div>
      )}
    </section>
  );
}
