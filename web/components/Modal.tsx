"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.16, ease: "easeOut" }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full ${maxWidthClass} rounded-xl bg-white p-5 shadow-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}
