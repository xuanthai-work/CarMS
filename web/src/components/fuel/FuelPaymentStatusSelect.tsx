"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { dropdownMotion } from "@/utils/motion";
import { useDismiss } from "@/hooks/common/useDismiss";

export default function FuelPaymentStatusSelect({
  name,
  value,
  onChange,
  paidLabel = "Đã thanh toán",
  unpaidLabel = "Chưa thanh toán",
}: {
  name: string;
  value: "paid" | "unpaid";
  onChange: (next: "paid" | "unpaid") => void;
  paidLabel?: string;
  unpaidLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useDismiss(open, ref, () => setOpen(false));
  const reduceMotion = useReducedMotion();

  const options = [
    {
      value: "paid" as const,
      label: paidLabel,
      chip: "bg-emerald-100 text-emerald-700",
      swatch: "bg-emerald-400",
    },
    {
      value: "unpaid" as const,
      label: unpaidLabel,
      chip: "bg-amber-100 text-amber-700",
      swatch: "bg-amber-400",
    },
  ];

  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-sm transition ${
          current.chip
        } ${open ? "ring-2 ring-brand-400" : "hover:brightness-95"}`}
      >
        <span className="truncate">{current.label}</span>
        <span className={`text-xs text-slate-500 transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...dropdownMotion(reduceMotion)}
            className="absolute inset-x-0 top-full z-30 mt-2 rounded-xl border border-hairline bg-surface p-1.5 shadow-xl"
          >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  active ? "bg-brand-600 font-semibold text-white" : "text-ink hover:bg-canvas"
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
