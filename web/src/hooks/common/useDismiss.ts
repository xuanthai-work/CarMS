import { useEffect, type RefObject } from "react";

/**
 * Đóng popover khi bấm ra ngoài `ref` hoặc nhấn Escape.
 * Chỉ gắn listener khi `open` (gỡ khi đóng/unmount) — dùng chung cho DatePicker/TimePicker/Combobox.
 */
export function useDismiss(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
