"use client";

import { useRef, useState } from "react";
import { useDismiss } from "@/lib/useDismiss";

/**
 * Dropdown popover tự thiết kế (cùng vibe DatePicker/StatusSelect) cho danh sách lựa chọn dạng chuỗi.
 * Controlled: submit qua hidden input `name`. Đóng khi bấm ra ngoài (useDismiss).
 */
export default function SelectMenu({
  name,
  value,
  onChange,
  options,
  placeholder = "Chọn…",
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useDismiss(open, ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition ${
          open ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-300 hover:border-slate-400"
        } ${value ? "text-slate-800" : "text-slate-400"}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <span className={`text-[10px] text-slate-500 transition ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {options.map((opt) => {
            const active = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`block w-full rounded-md px-3 py-1.5 text-left text-sm transition ${
                  active ? "bg-brand-600 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
