"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { dropdownMotion } from "@/utils/motion";
import { useDismiss } from "@/hooks/common/useDismiss";

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
  placement = "down",
  variant = "default",
  leadingDotClassName,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly Option[];
  placeholder?: string;
  /** Hướng bung menu. "up" khi control nằm sát đáy (VD composer chat) để không tràn xuống dưới. */
  placement?: "down" | "up";
  /** Kiểu nút: "default" (form) hoặc "pill" (viên thuốc gọn — dùng cho chọn model). */
  variant?: "default" | "pill";
  /** Chấm màu trước nhãn (hợp với variant="pill"). VD "bg-indigo-500". */
  leadingDotClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useDismiss(open, ref, () => setOpen(false));
  const reduceMotion = useReducedMotion();

  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selectedLabel = opts.find((o) => o.value === value)?.label ?? "";
  const isPill = variant === "pill";

  const triggerClass = isPill
    ? `flex h-8 w-full items-center justify-between gap-2 rounded-full border bg-white px-3 text-sm font-medium shadow-sm transition ${
        open ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-200 hover:border-slate-300"
      } ${selectedLabel ? "text-slate-700" : "text-slate-400"}`
    : `flex h-9 w-full items-center justify-between gap-2 rounded-xl border px-3 text-sm transition ${
        open ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-300 hover:border-slate-400"
      } ${selectedLabel ? "text-slate-800" : "text-slate-400"}`;

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={triggerClass}>
        <span className="flex min-w-0 items-center gap-2">
          {leadingDotClassName && (
            <span className={`h-2 w-2 shrink-0 rounded-full ${leadingDotClassName}`} aria-hidden="true" />
          )}
          <span className="truncate">{selectedLabel || placeholder}</span>
        </span>
        <span
          className={`text-xs transition ${isPill ? "text-slate-400" : "text-slate-500"} ${
            open ? "rotate-180" : ""
          }`}
        >
          ⌄
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...dropdownMotion(reduceMotion)}
            className={`absolute inset-x-0 z-30 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl ${
              placement === "up" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
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
