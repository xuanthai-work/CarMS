"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { dropdownMotion } from "@/lib/motion";
import { useDismiss } from "@/lib/useDismiss";

const OPTIONS = [
  {
    value: "paid",
    label: "Đã thanh toán",
    chip: "bg-emerald-100 text-emerald-700",
    swatch: "bg-emerald-400",
  },
  {
    value: "unpaid",
    label: "Chưa thanh toán",
    chip: "bg-amber-100 text-amber-700",
    swatch: "bg-amber-400",
  },
] as const;

export default function FuelPaymentStatusSelect({
  name,
  value,
  onChange,
}: {
  name: string;
  value: "paid" | "unpaid";
  onChange: (next: "paid" | "unpaid") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useDismiss(open, ref, () => setOpen(false));
  const reduceMotion = useReducedMotion();

  const current = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition ${
          current.chip
        } ${open ? "ring-2 ring-brand-400" : "hover:brightness-95"}`}
      >
        <span className="truncate">{current.label}</span>
        <span className={`text-[10px] text-slate-500 transition ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...dropdownMotion(reduceMotion)}
            className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          >
          {OPTIONS.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition ${
                  active ? "bg-brand-600 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${active ? "bg-white" : option.swatch}`} />
                {option.label}
              </button>
            );
          })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
