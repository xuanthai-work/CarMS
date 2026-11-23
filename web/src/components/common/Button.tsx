import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "md" | "toolbar";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
  secondary: "border border-hairline bg-surface font-medium text-muted hover:bg-canvas",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
};

const SIZE: Record<ButtonSize, string> = {
  md: "px-5 py-2",
  toolbar: "h-9 px-4",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
): string {
  const v = VARIANT[variant] ?? VARIANT.primary;
  const s = SIZE[size] ?? SIZE.md;
  return extra ? `${BASE} ${v} ${s} ${extra}` : `${BASE} ${v} ${s}`;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}
