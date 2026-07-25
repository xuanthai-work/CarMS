"use client";

import { PencilSimple } from "@phosphor-icons/react";

/**
 * Nút biểu tượng bút chì "Chỉnh sửa" ở chế độ xem chi tiết trong modal.
 *
 * Để riêng file (không nằm trong ui.tsx) và ĐÁNH DẤU "use client" vì
 * @phosphor-icons/react gọi createContext() ở top-level module và bundle của nó
 * không tự khai báo "use client". Nếu nó bị kéo vào một Server Component thì
 * React bản react-server không có createContext → TypeError lúc runtime.
 * Nhờ tách ra, ui.tsx giữ được tính chất dùng được ở CẢ server và client.
 */
export function EditIconButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Chỉnh sửa"
      title="Chỉnh sửa"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-hairline text-muted transition hover:bg-canvas active:scale-[0.98]"
    >
      <PencilSimple size={18} weight="regular" aria-hidden="true" />
    </button>
  );
}

export default EditIconButton;
