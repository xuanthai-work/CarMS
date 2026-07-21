"use client";

import { useEffect, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // bước 5 phút

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Ô chọn giờ: nút hiển thị + popover 2 cột giờ/phút (thay input[type=time] mặc định). */
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
  const hourColRef = useRef<HTMLDivElement | null>(null);
  const minColRef = useRef<HTMLDivElement | null>(null);

  const [hStr, mStr] = val ? val.split(":") : ["", ""];
  const h = hStr === "" ? null : Number(hStr);
  const m = mStr === "" ? null : Number(mStr);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Cuộn mục đang chọn vào giữa khi mở.
  useEffect(() => {
    if (!open) return;
    for (const col of [hourColRef.current, minColRef.current]) {
      col?.querySelector<HTMLElement>("[data-sel=true]")?.scrollIntoView({ block: "center" });
    }
  }, [open]);

  function pick(nh: number | null, nm: number | null) {
    const H = nh ?? h ?? 0;
    const M = nm ?? m ?? 0;
    setVal(`${pad(H)}:${pad(M)}`);
  }

  const colCls = "max-h-44 w-16 overflow-y-auto thin-scroll scroll-smooth py-1";
  const itemCls = (active: boolean) =>
    `mx-1 my-0.5 grid h-8 place-items-center rounded-md text-sm transition ${
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
        <div className="absolute left-0 top-full z-30 mt-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="flex gap-1">
            <div className="flex flex-col">
              <div className="px-1 pb-1 text-center text-[10px] font-semibold uppercase text-slate-400">Giờ</div>
              <div ref={hourColRef} className={colCls}>
                {HOURS.map((hh) => (
                  <button
                    key={hh}
                    type="button"
                    data-sel={h === hh}
                    onClick={() => pick(hh, null)}
                    className={itemCls(h === hh)}
                  >
                    {pad(hh)}
                  </button>
                ))}
              </div>
            </div>
            <div className="my-6 w-px bg-slate-200" />
            <div className="flex flex-col">
              <div className="px-1 pb-1 text-center text-[10px] font-semibold uppercase text-slate-400">Phút</div>
              <div ref={minColRef} className={colCls}>
                {MINUTES.map((mm) => (
                  <button
                    key={mm}
                    type="button"
                    data-sel={m === mm}
                    onClick={() => pick(null, mm)}
                    className={itemCls(m === mm)}
                  >
                    {pad(mm)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 w-full rounded-md bg-brand-600 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Xong
          </button>
        </div>
      )}
    </div>
  );
}
