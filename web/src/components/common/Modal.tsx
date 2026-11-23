"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { freshOrigin, originOffset, type Point } from "@/utils/modalOrigin";
import { useOverlayClose } from "@/hooks/common/useOverlayClose";

const ZOOM_FROM = 0.35;
const OFFSET_RATIO = 0.85;
const OPEN_MS = 240;
const CLOSE_MS = 180;

let lastPointer: { x: number; y: number; t: number } | null = null;
if (typeof document !== "undefined") {
  document.addEventListener(
    "pointerdown",
    (e) => {
      lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() };
    },
    { capture: true, passive: true }
  );
}

export default function Modal({
  title,
  onClose,
  children,
  maxWidthClass = "max-w-xl",
  fixedHeight = false,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
  fixedHeight?: boolean;
  footer?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const { closing, requestClose } = useOverlayClose(onClose, CLOSE_MS, reduceMotion);

  const [origin] = useState<Point | null>(() => {
    if (typeof window === "undefined") return null;
    return freshOrigin(lastPointer, performance.now());
  });

  const [offset] = useState<Point>(() => {
    if (typeof window === "undefined" || !origin) return { x: 0, y: 0 };
    return originOffset(origin, { w: window.innerWidth, h: window.innerHeight });
  });

  const initialPanel = reduceMotion
    ? { opacity: 0 }
    : origin !== null
    ? { opacity: 0, scale: ZOOM_FROM, x: offset.x * OFFSET_RATIO, y: offset.y * OFFSET_RATIO }
    : { opacity: 0, scale: 0.94, x: 0, y: 0 };

  const animatePanel = reduceMotion
    ? { opacity: closing ? 0 : 1 }
    : closing
    ? origin !== null
      ? { opacity: 0, scale: ZOOM_FROM, x: offset.x * OFFSET_RATIO, y: offset.y * OFFSET_RATIO }
      : { opacity: 0, scale: 0.94, x: 0, y: 0 }
    : { opacity: 1, scale: 1, x: 0, y: 0 };

  const transitionPanel: Transition = reduceMotion
    ? { duration: 0 }
    : {
        duration: (closing ? CLOSE_MS : OPEN_MS) / 1000,
        ease: [0.22, 1, 0.36, 1] as const,
      };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0 : closing ? CLOSE_MS / 1000 : 0.16, ease: "easeOut" }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40"
      onClick={requestClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={initialPanel}
          animate={animatePanel}
          transition={transitionPanel}
          className={
            fixedHeight
              ? `flex flex-col h-[min(46rem,calc(100dvh-2rem))] w-full ${maxWidthClass} overflow-hidden rounded-xl bg-white p-4 shadow-xl`
              : `w-full ${maxWidthClass} rounded-xl bg-white p-5 shadow-xl`
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`${fixedHeight ? "mb-3 shrink-0" : "mb-4"} flex items-center justify-between`}>
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <button
              type="button"
              onClick={requestClose}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
          {fixedHeight ? (
            <div className="min-h-0 flex-1 overflow-y-auto scroll-thin pr-1">
              {children}
            </div>
          ) : (
            children
          )}
          {footer && (
            <div className={fixedHeight ? "shrink-0 border-t border-slate-100 pt-2 mt-2" : "mt-4"}>
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}
