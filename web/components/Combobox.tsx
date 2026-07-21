"use client";

import { useMemo, useRef, useState } from "react";
import { normalizeVn } from "@/lib/search";
import { useDismiss } from "@/lib/useDismiss";

export type ComboOption = { id: string; label: string; sub?: string };

/**
 * Ô chọn có thể GÕ để lọc + TẠO MỚI nhanh (thay <select>).
 * Lưu id qua <input hidden name> nên dùng trong form như bình thường.
 */
export default function Combobox({
  name,
  value,
  onChange,
  options,
  placeholder = "Chọn…",
  emptyText = "Không có kết quả",
  onCreate,
  createLabel,
  allowClear = true,
}: {
  name: string;
  value: string;
  onChange: (id: string) => void;
  options: ComboOption[];
  placeholder?: string;
  emptyText?: string;
  onCreate?: (text: string) => Promise<ComboOption | null>;
  createLabel?: (text: string) => string;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [extra, setExtra] = useState<ComboOption[]>([]); // mục vừa tạo (chưa có trong props)
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const all = useMemo(() => {
    const seen = new Set(options.map((o) => o.id));
    return [...options, ...extra.filter((e) => !seen.has(e.id))];
  }, [options, extra]);

  const selected = all.find((o) => o.id === value) ?? null;
  const trimmed = query.trim();

  const filtered = useMemo(() => {
    const q = normalizeVn(trimmed);
    if (!q) return all;
    return all.filter((o) => normalizeVn(`${o.label} ${o.sub ?? ""}`).includes(q));
  }, [trimmed, all]);

  const exact = all.some((o) => normalizeVn(o.label) === normalizeVn(trimmed));
  const canCreate = !!onCreate && trimmed !== "" && !exact;

  useDismiss(open, wrapRef, () => setOpen(false));

  function choose(id: string) {
    onChange(id);
    setQuery("");
    setOpen(false);
  }
  async function create() {
    if (!onCreate || !trimmed) return;
    setBusy(true);
    try {
      const created = await onCreate(trimmed);
      if (created) {
        setExtra((p) => [created, ...p]);
        choose(created.id);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <input
          value={open ? query : selected?.label ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          placeholder={selected ? selected.label : placeholder}
          className="w-full rounded-md border border-slate-300 py-2 pl-3 pr-8 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">▾</span>
      </div>

      {open && (
        <div className="thin-scroll absolute left-0 top-full z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {allowClear && (
            <button
              type="button"
              onClick={() => choose("")}
              className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-slate-400 hover:bg-slate-100"
            >
              — Không chọn —
            </button>
          )}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => choose(o.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-sm ${
                o.id === value ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="truncate">{o.label}</span>
              {o.sub && <span className="shrink-0 text-xs text-slate-400">{o.sub}</span>}
            </button>
          ))}
          {filtered.length === 0 && !canCreate && (
            <div className="px-3 py-2 text-sm text-slate-400">{emptyText}</div>
          )}
          {canCreate && (
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="mt-0.5 block w-full rounded-md border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
            >
              {busy ? "Đang tạo…" : createLabel ? createLabel(trimmed) : `+ Tạo mới “${trimmed}”`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
