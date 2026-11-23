import type { ReactNode } from "react";
import Button from "./Button";

// KHÔNG import thư viện chỉ chạy được ở client vào file này (vd @phosphor-icons/react,
// thứ gọi createContext ở top-level). ui.tsx cố ý KHÔNG có "use client" để Server
// Component cũng dùng được (profile/page.tsx dùng <Info>); kéo dep client vào đây là
// vỡ runtime ở phía server. Cần icon thì tách ra file riêng có "use client",
// như EditIconButton.tsx.

// Class dùng chung cho input/select trong các form.
export const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
export const labelCls = "block text-xs font-medium text-slate-600 mb-1";

// Hiệu ứng hover thẻ lịch dùng chung cho hai chế độ xem.
export const CARD_HOVER =
  "transition duration-150 ease-out hover:z-20 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md";
export const CARD_HOVER_GROUP =
  "transition duration-150 ease-out group-hover:z-20 group-hover:-translate-y-0.5 group-hover:scale-[1.01] group-hover:shadow-md";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

/** Hiển thị một mục thông tin (nhãn + giá trị) ở chế độ xem. */
export function Info({
  label,
  value,
  className = "",
  size = "sm",
}: {
  label: string;
  value: ReactNode;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={className}>
      <div className={`font-medium text-muted ${size === "md" ? "text-sm" : "text-xs"}`}>{label}</div>
      <div className={`text-ink ${size === "md" ? "text-base" : "text-sm"}`}>{value}</div>
    </div>
  );
}

/** Ô chứa một trường trong lưới form thêm/sửa (nền trắng, bo góc). */
export function DetailCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-surface px-3 py-3 shadow-sm ${className}`}>{children}</div>;
}

/** Huy hiệu trạng thái trả tiền (xanh = đã trả / hổ phách = chưa). Nhãn đổi theo ngữ cảnh. */
export function PaymentStatusBadge({
  paid,
  paidLabel = "Đã trả",
  unpaidLabel = "Chưa trả",
}: {
  paid: boolean;
  paidLabel?: string;
  unpaidLabel?: string;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {paid ? paidLabel : unpaidLabel}
    </span>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-hairline bg-surface p-2.5 shadow-card">
      {children}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-hairline bg-canvas px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:bg-surface focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
}

export function CancelButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <Button variant="secondary" onClick={onClick} className={className}>
      Hủy
    </Button>
  );
}

export function SaveButton({ form, children = "Lưu" }: { form?: string; children?: ReactNode }) {
  return (
    <Button type="submit" form={form}>
      {children}
    </Button>
  );
}

/** Banner lỗi đỏ trong form/modal; không hiện gì khi không có thông điệp. Cùng kiểu với banner của TripForm. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      <span aria-hidden>⚠️</span>
      <span>{message}</span>
    </div>
  );
}
