"use client";

import { useEffect, useRef, useState } from "react";
import { pad } from "@/lib/format";
import { useDismiss } from "@/lib/useDismiss";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // bước 5 phút

/** Chuẩn hoá chuỗi người dùng gõ → "HH:mm" (rỗng nếu không đọc được).
 *  Chấp nhận: "8:30", "08:30", "8" → 08:00, "830" → 08:30, "1230" → 12:30. */
function normalizeTime(s: string): string {
  const t = s.trim();
  if (!t) return "";
  let hh: number;
  let mm: number;
  if (t.includes(":")) {
    const [a, b] = t.split(":");
    hh = Number(a.replace(/\D/g, ""));
    mm = Number((b ?? "").replace(/\D/g, "")) || 0;
  } else {
    const d = t.replace(/\D/g, "");
    if (!d) return "";
    if (d.length <= 2) {
      hh = Number(d);
      mm = 0;
    } else {
      const p = d.padStart(3, "0");
      mm = Number(p.slice(-2));
      hh = Number(p.slice(0, -2));
    }
  }
  if (Number.isNaN(hh) || Number.isNaN(mm)) return "";
  hh = Math.min(23, Math.max(0, hh));
  mm = Math.min(59, Math.max(0, mm));
  return `${pad(hh)}:${pad(mm)}`;
}

/** Ô chọn giờ: gõ trực tiếp "HH:mm" HOẶC mở 2 cột cuộn giờ/phút để bấm. */
export default function TimePicker({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string; // "HH:mm" | ""
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(defaultValue); // giá trị chuẩn gửi form
  const [text, setText] = useState(defaultValue); // chuỗi đang gõ trong ô
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const hColRef = useRef<HTMLDivElement | null>(null);
  const mColRef = useRef<HTMLDivElement | null>(null);

  const [hStr, mStr] = val ? val.split(":") : ["", ""];
  const h = hStr === "" ? null : Number(hStr);
  const m = mStr === "" ? null : Number(mStr);

  useDismiss(open, wrapRef, () => setOpen(false));

  // Khi mở: cuộn mỗi cột tới đúng mục đang chọn (canh giữa).
  useEffect(() => {
    if (!open) return;
    const center = (col: HTMLDivElement | null) => {
      if (!col) return;
      const active = col.querySelector<HTMLElement>("[data-active='true']");
      if (active) col.scrollTop = active.offsetTop - col.clientHeight / 2 + active.offsetHeight / 2;
    };
    center(hColRef.current);
    center(mColRef.current);
  }, [open]);

  /** Gõ xong (blur) → chuẩn hoá text về HH:mm. */
  function commit(next: string) {
    const norm = normalizeTime(next);
    setVal(norm);
    setText(norm);
  }

  /** Bấm 1 mục trong cột. */
  function pick(nh: number | null, nm: number | null) {
    const H = nh ?? h ?? 0;
    const M = nm ?? m ?? 0;
    const norm = `${pad(H)}:${pad(M)}`;
    setVal(norm);
    setText(norm);
  }

  const rowCell = (active: boolean) =>
    `block w-full rounded-md px-3 py-1.5 text-center text-sm transition ${
      active ? "bg-brand-600 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"
    }`;

  const colHeader = "mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400";
  const colBox = "no-scrollbar relative h-44 overflow-y-auto rounded-md border border-slate-100 p-1";

  return (
    <div className="relative" ref={wrapRef}>
      <input type="hidden" name={name} value={val} />

      {/* Ô input gõ được + nút mở bảng */}
      <div
        className={`flex w-full items-center rounded-md border pr-2 text-sm transition ${
          open ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => commit(text)}
          placeholder="Chọn / gõ giờ"
          className="w-full rounded-md bg-transparent px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 text-slate-400 hover:text-slate-600"
          aria-label="Mở bảng chọn giờ"
        >
          🕐
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className={colHeader}>Giờ</div>
              <div ref={hColRef} className={colBox}>
                {HOURS.map((hh) => (
                  <button
                    key={hh}
                    type="button"
                    data-active={h === hh ? "true" : undefined}
                    onClick={() => pick(hh, null)}
                    className={rowCell(h === hh)}
                  >
                    {pad(hh)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className={colHeader}>Phút</div>
              <div ref={mColRef} className={colBox}>
                {MINUTES.map((mm) => (
                  <button
                    key={mm}
                    type="button"
                    data-active={m === mm ? "true" : undefined}
                    onClick={() => pick(null, mm)}
                    className={rowCell(m === mm)}
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
            className="mt-2 w-full rounded-md bg-brand-600 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Xong
          </button>
        </div>
      )}
    </div>
  );
}
