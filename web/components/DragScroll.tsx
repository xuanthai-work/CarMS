"use client";

import { useCallback, useRef, type ReactNode } from "react";

/**
 * Vùng cuộn ngang "cầm & kéo" bằng chuột (grab to pan).
 * - initialLeft: vị trí cuộn ban đầu (px) — đặt ngay khi node gắn, không nháy.
 * - CHỈ bắt pointer sau khi kéo >4px, để click bình thường vào thẻ con vẫn hoạt động.
 */
export default function DragScroll({
  className,
  children,
  initialLeft = 0,
}: {
  className?: string;
  children: ReactNode;
  initialLeft?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const st = useRef({ down: false, moved: false, captured: false, startX: 0, startLeft: 0, pointerId: -1 });

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      if (node) node.scrollLeft = initialLeft;
    },
    [initialLeft]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    st.current = { down: true, moved: false, captured: false, startX: e.clientX, startLeft: el.scrollLeft, pointerId: e.pointerId };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    const s = st.current;
    if (!el || !s.down) return;
    const dx = e.clientX - s.startX;
    if (!s.moved && Math.abs(dx) > 4) {
      s.moved = true;
      try {
        el.setPointerCapture(s.pointerId);
        s.captured = true;
      } catch {
        /* noop */
      }
    }
    if (s.moved) el.scrollLeft = s.startLeft - dx;
  };
  const endDrag = () => {
    const el = ref.current;
    const s = st.current;
    if (el && s.captured) {
      try {
        el.releasePointerCapture(s.pointerId);
      } catch {
        /* noop */
      }
    }
    s.down = false;
    s.captured = false;
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (st.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      st.current.moved = false;
    }
  };

  return (
    <div
      ref={attach}
      className={`${className ?? ""} cursor-grab active:cursor-grabbing`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
}
