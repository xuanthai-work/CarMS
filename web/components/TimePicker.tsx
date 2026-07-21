"use client";

import { useRef, useState } from "react";
import { pad } from "@/lib/format";
import { useDismiss } from "@/lib/useDismiss";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // bước 5 phút

/** Ô chọn giờ: nút hiển thị + popover lưới giờ/phút (thay input[type=time] mặc định). */
export default function TimePicker({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string; // "HH:mm" | ""
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(defaultValue);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [hStr, mStr] = val ? val.split(":") : ["", ""];
  const h = hStr === "" ? null : Number(hStr);
  const m = mStr === "" ? null : Number(mStr);

  useDismiss(open, wrapRef, () => setOpen(false));

  function pick(nh: number | null, nm: number | null) {
    const H = nh ?? h ?? 0;
    const M = nm ?? m ?? 0;
    setVal(`${pad(H)}:${pad(M)}`);
  }

  const cell = (active: boolean) =>
    `grid h-8 place-items-center rounded-md text-sm transition ${
      active ? "bg-brand-600 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="relative" ref={wrapRef}>
      <input type="hidden" name={name} value={val} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition ${
          open ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-300 hover:border-slate-400"
        } ${val ? "text-slate-800" : "text-slate-400"}`}
      >
        <span>{val || "Chọn giờ"}</span>
        <span className="text-slate-400">🕐</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Giờ</div>
          <div className="grid grid-cols-6 gap-1">
            {HOURS.map((hh) => (
              <button key={hh} type="button" onClick={() => pick(hh, null)} className={cell(h === hh)}>
                {pad(hh)}
              </button>
            ))}
          </div>
          <div className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phút</div>
          <div className="grid grid-cols-6 gap-1">
            {MINUTES.map((mm) => (
              <button key={mm} type="button" onClick={() => pick(null, mm)} className={cell(m === mm)}>
                {pad(mm)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-md bg-brand-600 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Xong
          </button>
        </div>
      )}
    </div>
  );
}
