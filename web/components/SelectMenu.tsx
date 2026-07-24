"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { dropdownMotion } from "@/lib/motion";
import { useDismiss } from "@/lib/useDismiss";

/** Option: chuỗi thuần (value = label) hoặc cặp {value, label} khi mã lưu ≠ nhãn hiển thị. */
type Option = string | { value: string; label: string };

/**
 * Dropdown popover tự thiết kế (cùng vibe DatePicker/StatusSelect).
 * Controlled: submit `value` qua hidden input `name`. Đóng khi bấm ra ngoài (useDismiss).
 * Nhận options dạng string[] (value = label) hoặc {value,label}[] (mã ≠ nhãn, VD trạng thái xe).
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
  options: readonly Option[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useDismiss(open, ref, () => setOpen(false));
  const reduceMotion = useReducedMotion();

  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selectedLabel = opts.find((o) => o.value === value)?.label ?? "";

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-xl border px-3 text-sm transition ${
          open ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-300 hover:border-slate-400"
        } ${selectedLabel ? "text-slate-800" : "text-slate-400"}`}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <span className={`text-xs text-slate-500 transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...dropdownMotion(reduceMotion)}
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          >
          {opts.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full rounded-md px-3 py-1.5 text-left text-sm transition ${
                  active ? "bg-brand-600 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
