"use client";

import { useEffect } from "react";

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div
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
        </div>
      </div>
    </div>
  );
}
