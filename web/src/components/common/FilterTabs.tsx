"use client";

import { useId } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";

type FilterOption<T extends string> = readonly [T, string];

export default function FilterTabs<T extends string>({
  value,
  options,
  onChange,
  ariaLabel = "Bộ lọc",
}: {
  value: T;
  options: readonly FilterOption<T>[];
  onChange: (next: T) => void;
  ariaLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const groupId = useId();

  return (
    <LayoutGroup id={groupId}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="inline-flex h-9 items-center overflow-hidden rounded-xl border border-hairline bg-surface text-sm font-medium shadow-sm"
      >
        {options.map(([optionValue, label]) => {
          const active = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(optionValue)}
              className={`relative h-9 rounded-[10px] px-3 py-0 transition-colors duration-150 ${
                active ? "text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="active-filter"
                  transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
                  className="absolute inset-0 rounded-[10px] bg-brand-600"
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
