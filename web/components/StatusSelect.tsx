"use client";

import { useRef, useState } from "react";
import { TRIP_STATUSES, statusChipClass, tripStatusLabel } from "@/lib/trips";
import { useDismiss } from "@/lib/useDismiss";

/**
 * Dropdown chọn trạng thái — cùng vibe DatePicker/TimePicker (popover tự thiết kế).
 * Nút tô nền theo trạng thái (màu legend), chữ đen; mỗi mục có chấm màu như legend.
 * `onPick` chỉ được gọi khi chọn trạng thái KHÁC hiện tại (để nơi gọi hiện popup xác nhận).
 */
export default function StatusSelect({
  status,
  onPick,
}: {
  status?: string;
  onPick: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useDismiss(open, ref, () => setOpen(false));

  const current = status ?? "pending";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition ${statusChipClass(
          status
        )} ${open ? "ring-2 ring-brand-400" : "hover:brightness-95"}`}
      >
        <span className="truncate">{tripStatusLabel(status)}</span>
        <span className={`text-[10px] text-slate-500 transition ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {TRIP_STATUSES.map((s) => {
            const active = s.value === current;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  if (!active) onPick(s.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition ${
                  active ? "bg-brand-600 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${active ? "bg-white" : s.swatch}`} />
                {s.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
