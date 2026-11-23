"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { freshOrigin, originOffset, type Point } from "@/utils/modalOrigin";

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
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [closing, setClosing] = useState(false);
  const isClosingRef = useRef(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const [origin] = useState<Point | null>(() => {
    if (typeof window === "undefined") return null;
    return freshOrigin(lastPointer, performance.now());
  });

  const [offset] = useState<Point>(() => {
    if (typeof window === "undefined" || !origin) return { x: 0, y: 0 };
    return originOffset(origin, { w: window.innerWidth, h: window.innerHeight });
  });

  const requestClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    if (reduceMotion) {
      onCloseRef.current();
      return;
    }
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      onCloseRef.current();
    }, CLOSE_MS);
  }, [reduceMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        requestClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [requestClose]);

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
          className={`w-full ${maxWidthClass} rounded-xl bg-white p-5 shadow-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
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
          {children}
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}
