"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useDismiss } from "@/hooks/common/useDismiss";
import { dropdownMotion } from "@/utils/motion";
import { companyVehicles } from "@/utils/vehicles";
import type { Vehicle } from "@/types";

export default function VehicleFilterSelect({
  value,
  vehicles,
  onChange,
}: {
  value: string;
  vehicles: Vehicle[];
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useDismiss(open, ref, () => setOpen(false));
  const reduceMotion = useReducedMotion();
  const companyList = useMemo(() => companyVehicles(vehicles), [vehicles]);
  const selectedLabel =
    value === "all"
      ? "Tất cả xe"
      : (companyList.find((v) => v.id === value)?.plate ?? "Tất cả xe");

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex h-9 min-w-[148px] items-center justify-between gap-2 rounded-xl border px-3.5 text-sm font-medium text-ink shadow-sm transition ${
          open
            ? "border-brand-500 bg-white ring-1 ring-brand-500"
            : "border-hairline bg-surface hover:border-slate-400"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <span
          className={`text-xs text-muted transition ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...dropdownMotion(reduceMotion)}
            className="absolute left-0 top-full z-30 mt-2 max-h-72 min-w-full overflow-auto rounded-xl border border-hairline bg-surface p-1.5 shadow-xl"
          >
            <button
              type="button"
              onClick={() => {
                onChange("all");
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                value === "all"
                  ? "bg-brand-600 font-semibold text-white"
                  : "text-ink hover:bg-canvas"
              }`}
            >
              Tất cả xe
            </button>
            {companyList.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onChange(v.id);
                  setOpen(false);
                }}
                className={`mt-0.5 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  value === v.id
                    ? "bg-brand-600 font-semibold text-white"
                    : "text-ink hover:bg-canvas"
                }`}
              >
                {v.plate}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
