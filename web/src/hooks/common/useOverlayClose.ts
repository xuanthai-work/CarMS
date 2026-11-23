"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export function useOverlayClose(
  onClose: () => void,
  closeMs: number,
  reduceMotion: boolean | null
): { closing: boolean; requestClose: () => void } {
  const [closing, setClosing] = useState(false);
  const isClosingRef = useRef(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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
    }, closeMs);
  }, [closeMs, reduceMotion]);

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

  return { closing, requestClose };
}
