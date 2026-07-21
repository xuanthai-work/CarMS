"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pad } from "@/lib/format";
import { useDismiss } from "@/lib/useDismiss";

const WD = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`; // m: 0-based
}
function parse(v: string): { y: number; m: number; d: number } | null {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

/** Ô chọn ngày: nút hiển thị + lịch popover tự thiết kế (thay input[type=date] mặc định). */
export default function DatePicker({
  name,
  value,
  onChange,
  disabled,
}: {
  name: string;
  value: string; // YYYY-MM-DD | ""
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const sel = useMemo(() => parse(value), [value]);
  const [view, setView] = useState(() => {
    const p = parse(value);
    const t = new Date();
    return p ? { y: p.y, m: p.m } : { y: t.getFullYear(), m: t.getMonth() };
  });

  // Mở lại thì nhảy về tháng của ngày đang chọn.
  useEffect(() => {
    if (open && sel) setView({ y: sel.y, m: sel.m });
  }, [open, sel]);

  useDismiss(open, wrapRef, () => setOpen(false));

  const today = new Date();
  const [ty, tm, td] = [today.getFullYear(), today.getMonth(), today.getDate()];

  const cells = useMemo(() => {
    const startWd = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // T2 = 0
    const total = new Date(view.y, view.m + 1, 0).getDate();
    const arr: (number | null)[] = Array.from({ length: startWd }, () => null);
    for (let d = 1; d <= total; d++) arr.push(d);
    return arr;
  }, [view]);

  function shiftMonth(delta: number) {
    setView((v) => {
      const m = v.m + delta;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });
  }

  const displayText = sel ? `${pad(sel.d)}/${pad(sel.m + 1)}/${sel.y}` : "Chọn ngày";

  return (
    <div className="relative" ref={wrapRef}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition ${
          open ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-300 hover:border-slate-400"
        } ${sel ? "text-slate-800" : "text-slate-400"} disabled:opacity-50`}
      >
        <span>{displayText}</span>
        <span className="text-slate-400">📅</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-[268px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          {/* Header tháng */}
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100">←</button>
            <span className="text-sm font-semibold text-slate-700">Tháng {view.m + 1}, {view.y}</span>
            <button type="button" onClick={() => shiftMonth(1)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100">→</button>
          </div>
          {/* Thứ */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-slate-400">
            {WD.map((w) => (
              <div key={w} className={w === "CN" ? "text-rose-400" : ""}>{w}</div>
            ))}
          </div>
          {/* Ngày */}
          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const isSel = !!sel && sel.y === view.y && sel.m === view.m && sel.d === d;
              const isToday = ty === view.y && tm === view.m && td === d;
              const isSun = (i % 7) === 6;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(iso(view.y, view.m, d));
                    setOpen(false);
                  }}
                  className={`grid h-8 w-8 place-items-center rounded-md text-sm transition ${
                    isSel
                      ? "bg-brand-600 font-semibold text-white"
                      : isToday
                      ? "bg-brand-50 font-semibold text-brand-700 hover:bg-brand-100"
                      : `${isSun ? "text-rose-500" : "text-slate-700"} hover:bg-slate-100`
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
