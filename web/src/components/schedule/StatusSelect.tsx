"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { dropdownMotion } from "@/utils/motion";
import { TRIP_STATUSES, statusChipClass, tripStatusLabel } from "@/utils/trips";

type PopupPos = { top?: number; bottom?: number; right: number };

/**
 * Dropdown chọn trạng thái — render qua portal ra `document.body` (position: fixed)
 * để không bị cắt bởi `overflow-hidden`/`overflow-x-auto` của bảng.
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
  const [pos, setPos] = useState<PopupPos | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  const current = status ?? "pending";

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const right = Math.max(8, window.innerWidth - rect.right);
    const popupH = menuRef.current?.offsetHeight ?? 136;
    const flipUp = rect.bottom + 4 + popupH > window.innerHeight && rect.top - 4 - popupH >= 0;
    setPos(flipUp ? { bottom: window.innerHeight - rect.top + 4, right } : { top: rect.bottom + 4, right });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const close = () => setOpen(false);

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition md:min-h-0 ${statusChipClass(
          status
        )} ${open ? "ring-2 ring-brand-400" : "hover:brightness-95"}`}
      >
        <span className="truncate">{tripStatusLabel(status)}</span>
        <span className={`text-xs text-slate-500 transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                {...dropdownMotion(reduceMotion)}
                style={
                  pos
                    ? { top: pos.top, bottom: pos.bottom, right: pos.right }
                    : { top: -9999, right: 0 }
                }
                className="fixed z-50 w-max min-w-[150px] max-w-[calc(100vw-1rem)] rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
              >
                {TRIP_STATUSES.filter((s) => s.value !== "cancelled").map((s) => {
                  const active = s.value === current;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        if (!active) onPick(s.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-2.5 text-left text-sm transition md:py-1.5 ${
                        active ? "bg-brand-600 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${active ? "bg-white" : s.swatch}`} />
                      {s.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
