"use client";

import { useCallback, useRef, type ReactNode } from "react";

/**
 * Vùng cuộn "cầm & kéo" bằng chuột (grab to pan), cả ngang lẫn dọc.
 * - initialLeft/initialTop: vị trí cuộn ban đầu (px) — đặt ngay khi node gắn, không nháy.
 * - CHỈ bắt pointer sau khi kéo >4px, để click bình thường vào thẻ con vẫn hoạt động.
 * Dùng chung với các phần tử position:sticky bên trong (ghim header/cột) — cuộn bình thường.
 */
export default function DragScroll({
  className,
  children,
  initialLeft = 0,
  initialTop = 0,
}: {
  className?: string;
  children: ReactNode;
  initialLeft?: number;
  initialTop?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const st = useRef({ down: false, moved: false, captured: false, startX: 0, startY: 0, startLeft: 0, startTop: 0, pointerId: -1 });

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      if (node) {
        node.scrollLeft = initialLeft;
        node.scrollTop = initialTop;
      }
    },
    [initialLeft, initialTop]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    st.current = {
      down: true,
      moved: false,
      captured: false,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: el.scrollLeft,
      startTop: el.scrollTop,
      pointerId: e.pointerId,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    const s = st.current;
    if (!el || !s.down) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (!s.moved && Math.max(Math.abs(dx), Math.abs(dy)) > 4) {
      s.moved = true;
      el.style.userSelect = "none"; // đang kéo thì không bôi đen text
      try {
        el.setPointerCapture(s.pointerId);
        s.captured = true;
      } catch {
        /* noop */
      }
    }
    if (s.moved) {
      el.scrollLeft = s.startLeft - dx;
      el.scrollTop = s.startTop - dy;
    }
  };
  const endDrag = () => {
    const el = ref.current;
    const s = st.current;
    if (el) {
      el.style.userSelect = "";
      if (s.captured) {
        try {
          el.releasePointerCapture(s.pointerId);
        } catch {
          /* noop */
        }
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
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
}
