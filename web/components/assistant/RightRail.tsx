"use client";

import type { ComponentType } from "react";
import { useAssistant } from "@/components/assistant/AssistantProvider";

/* ---- Icon 2 nét, kế thừa currentColor — cùng vibe icon Sidebar/Composer ---- */
type IconProps = { className?: string };
const ICON = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
function ChatBubbleIcon({ className }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <rect x="3.5" y="5" width="17" height="11.5" rx="3" />
      <path d="M8 16.5v3l3.6-3" />
      <path d="M7.8 9.3h8.4M7.8 12.3h5.6" />
    </svg>
  );
}

/**
 * Danh sách "extension" gắn trên rail — hiện chỉ có Trợ lý AI, nhưng khai báo dạng mảng
 * để thêm extension mới sau này chỉ là thêm 1 phần tử, không phải viết lại rail.
 */
type Extension = {
  id: string;
  label: string;
  icon: ComponentType<IconProps>;
  active: boolean;
  onClick: () => void;
};

export default function RightRail() {
  const { open, setOpen } = useAssistant();

  const extensions: Extension[] = [
    {
      id: "chat",
      label: "Trợ lý AI",
      icon: ChatBubbleIcon,
      active: open,
      onClick: () => setOpen(!open),
    },
  ];

  return (
    // Wrapper cao full màn + items-center để canh rail (cao 90%) giữa theo chiều dọc; vẫn sticky.
    <div className="sticky top-3 m-3 flex h-[calc(100vh-1.5rem)] shrink-0 items-center">
      <aside className="flex h-[calc((100vh-1.5rem)*0.9)] w-14 flex-col items-center gap-2 rounded-2xl bg-sidebar py-3 text-slate-300 shadow-[0_8px_28px_-6px_rgba(15,23,42,0.35)]">
      {extensions.map((ext) => {
        const Icon = ext.icon;
        return (
          <button
            key={ext.id}
            type="button"
            onClick={ext.onClick}
            aria-label={ext.label}
            aria-pressed={ext.active}
            title={ext.label}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
              ext.active ? "bg-dispatch-600 text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
        {/* Chỗ chờ cho các extension tiếp theo — divider mảnh để rõ đây là 1 dải, không phải nút đơn lẻ. */}
        <div className="mt-1 h-px w-8 shrink-0 bg-white/10" />
      </aside>
    </div>
  );
}
