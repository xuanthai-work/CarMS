"use client";

import type { ComponentType } from "react";
import { useAssistant } from "@/states/assistant/AssistantProvider";
import { ChatBubbleIcon, type IconProps } from "@/components/assistant/icons";

/**
 * Danh sách "extension" gắn trên rail — hiện chỉ có Trợ lý AI, nhưng khai báo dạng mảng
 * để thêm extension mới sau này chỉ là thêm 1 phần tử, không phải viết lại rail.
 */
type Extension = {
  id: string;
  label: string;
  icon: ComponentType<IconProps>;
  /** Ảnh đại diện (public) — nếu có thì hiện thay icon. */
  avatar?: string;
  active: boolean;
  onClick: () => void;
};

export default function RightRail() {
  const { open, setOpen } = useAssistant();

  const extensions: Extension[] = [
    {
      id: "chat",
      label: "Meow AI",
      icon: ChatBubbleIcon,
      avatar: "/meow-avatar.jpg",
      active: open,
      onClick: () => setOpen(!open),
    },
  ];

  return (
    // Wrapper cao full màn + items-center để canh rail (cao 90%) giữa theo chiều dọc; vẫn sticky.
    <div className="sticky top-3 m-3 flex h-[calc(100dvh-1.5rem)] shrink-0 items-center">
      <aside className="flex h-[calc((100dvh-1.5rem)*0.9)] w-14 flex-col items-center gap-2 rounded-2xl bg-sidebar py-3 text-slate-300 shadow-[0_8px_28px_-6px_rgba(15,23,42,0.35)]">
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
            {ext.avatar ? (
              <span className="h-7 w-7 overflow-hidden rounded-[10px] border border-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ext.avatar} alt="" className="h-full w-full object-cover" />
              </span>
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </button>
        );
      })}
        {/* Chỗ chờ cho các extension tiếp theo — divider mảnh để rõ đây là 1 dải, không phải nút đơn lẻ. */}
        <div className="mt-1 h-px w-8 shrink-0 bg-white/10" />
      </aside>
    </div>
  );
}
