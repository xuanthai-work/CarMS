// Nhịp chuyển động dùng chung (giây) cho các animation lặp lại nhiều nơi.
export const DURATION = {
  popover: 0.14, // dropdown/lịch/status xổ xuống
  enter: 0.18, // thẻ/hàng vào chế độ sửa
} as const;

export const EASE = { out: "easeOut" } as const;

/**
 * Props framer-motion cho popover xổ xuống (dropdown / lịch / status):
 * mờ + trượt nhẹ; reduced-motion → hiện thẳng (chỉ fade khi đóng).
 * Dùng: `<motion.div {...dropdownMotion(reduceMotion)} className="…">`.
 */
export function dropdownMotion(reduceMotion: boolean | null) {
  return {
    initial: reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -3, scale: 0.98 },
    transition: { duration: reduceMotion ? 0 : DURATION.popover, ease: EASE.out },
  };
}

/** Props cho thẻ/hàng khi vào chế độ sửa: mờ + trượt xuống nhẹ; reduced-motion → hiện thẳng. */
export function cardMotion(reduceMotion: boolean | null) {
  return {
    initial: reduceMotion ? false : { opacity: 0, y: -5 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : DURATION.enter, ease: EASE.out },
  };
}
