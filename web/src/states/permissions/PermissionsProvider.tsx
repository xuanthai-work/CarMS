"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Quyền ghi của người đang đăng nhập, phát từ layout (server) xuống mọi client component.
 * Dùng context vì canEdit cần ở ~14 component nằm sâu 2–3 tầng (VehicleCard ← VehicleList
 * ← page); truyền prop sẽ phải thêm prop vào cả tầng trung gian không dùng tới nó.
 *
 * Đây CHỈ để ẩn/hiện nút. Chặn thật nằm ở requireEditor/requireManagerEditor trong
 * src/services/auth.ts — mọi server action đều đi qua đó.
 */
type Permissions = {
  /** Được thêm/sửa/xoá dữ liệu. False với chức vụ chỉ-xem (CEO). */
  canEdit: boolean;
};

const PermissionsCtx = createContext<Permissions | null>(null);

export function usePermissions(): Permissions {
  const ctx = useContext(PermissionsCtx);
  if (!ctx) throw new Error("usePermissions phải nằm trong <PermissionsProvider>");
  return ctx;
}

export default function PermissionsProvider({
  canEdit,
  children,
}: Permissions & { children: ReactNode }) {
  return <PermissionsCtx.Provider value={{ canEdit }}>{children}</PermissionsCtx.Provider>;
}
