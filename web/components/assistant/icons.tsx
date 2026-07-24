/* Bộ icon dùng chung cho trợ lý (Composer/Drawer/Messages/RightRail/InstructionsDialog).
   2 nét, kế thừa currentColor — cùng vibe icon Sidebar. Gom về 1 chỗ để không lặp ICON + glyph. */
export type IconProps = { className?: string };

const ICON = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

/** Nút dừng — hình vuông tô đặc (khác kiểu nét của các icon còn lại). */
export function StopIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.6 6.4l-1.5 1.5M7.9 16.1l-1.5 1.5M17.6 17.6l-1.5-1.5M7.9 7.9 6.4 6.4" />
    </svg>
  );
}

/** Tam giác cảnh báo — dùng cho banner lỗi và ghi chú free-tier. */
export function WarningGlyph({ className }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M12 3.5 21 19.5H3L12 3.5Z" />
      <path d="M12 9.5v4.2" />
      <path d="M12 16.6v.1" />
    </svg>
  );
}

export function ChatBubbleIcon({ className }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <rect x="3.5" y="5" width="17" height="11.5" rx="3" />
      <path d="M8 16.5v3l3.6-3" />
      <path d="M7.8 9.3h8.4M7.8 12.3h5.6" />
    </svg>
  );
}

export function FileGlyph({ className }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M7 3.5h6.4L18 8.1V19.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M13.2 3.5V8.1H18" />
    </svg>
  );
}

export function LinkGlyph({ className }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M10 6.5H7A2 2 0 0 0 5 8.5v8A2 2 0 0 0 7 18.5h8a2 2 0 0 0 2-2v-3" />
      <path d="M13 5.5h5.5V11" />
      <path d="M18.3 5.7 10.8 13.2" />
    </svg>
  );
}
