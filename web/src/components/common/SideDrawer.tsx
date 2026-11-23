"use client";

import { createPortal } from "react-dom";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useOverlayClose } from "@/hooks/common/useOverlayClose";

const CLOSE_MS = 200;
const OPEN_MS = 260;
const EASE = [0.22, 1, 0.36, 1] as const;

export default function SideDrawer({
  title,
  onClose,
  children,
  footer,
  widthClass = "max-w-md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { closing, requestClose } = useOverlayClose(onClose, CLOSE_MS, reduceMotion);

  const backdropAnimate = { opacity: closing ? 0 : 1 };
  const backdropTransition = {
    duration: reduceMotion ? 0 : closing ? CLOSE_MS / 1000 : 0.16,
    ease: "easeOut" as const,
  };

  const panelInitial = reduceMotion ? { opacity: 0 } : { x: "100%" };
  const panelAnimate = reduceMotion
    ? { opacity: closing ? 0 : 1 }
    : { x: closing ? "100%" : 0 };
  const panelTransition: Transition = reduceMotion
    ? { duration: 0 }
    : {
        duration: (closing ? CLOSE_MS : OPEN_MS) / 1000,
        ease: EASE,
      };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={backdropAnimate}
      transition={backdropTransition}
      className="fixed inset-0 z-50 bg-slate-900/40"
      onClick={requestClose}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        initial={panelInitial}
        animate={panelAnimate}
        transition={panelTransition}
        className={`fixed inset-y-0 right-0 z-50 flex w-full ${widthClass} flex-col bg-white shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-2 border-t border-hairline px-5 py-3">
            {footer}
          </div>
        )}
      </motion.aside>
    </motion.div>,
    document.body
  );
}
