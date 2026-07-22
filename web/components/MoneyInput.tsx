"use client";

import { useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import { inputCls } from "@/components/ui";

/** Định dạng chuỗi số thành "1.500.000" (dấu chấm ngăn cách nghìn, kiểu vi-VN). */
function format(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("vi-VN") : "";
}

/**
 * Ô nhập tiền: hiện dấu chấm ngăn cách nghìn khi gõ (1.500.000) và GIỮ vị trí con trỏ
 * (theo số chữ số bên trái con trỏ) để sửa ở giữa chuỗi không bị nhảy về cuối.
 * Vẫn submit chuỗi có dấu chấm — server (`optNum`) tự bỏ ký tự không phải số nên lưu ra số đúng.
 */
export default function MoneyInput({
  name,
  defaultValue,
  placeholder,
  required,
  className,
}: {
  name: string;
  defaultValue?: number | string | null;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const [val, setVal] = useState(() => format(String(defaultValue ?? "")));
  const ref = useRef<HTMLInputElement | null>(null);
  const caretDigits = useRef<number | null>(null); // số chữ số bên trái con trỏ cần giữ

  // Sau khi format lại, đặt con trỏ vào đúng chỗ (sau `caretDigits` chữ số).
  useLayoutEffect(() => {
    const want = caretDigits.current;
    const el = ref.current;
    if (want == null || !el) return;
    caretDigits.current = null;
    let pos = 0;
    let seen = 0;
    while (pos < el.value.length && seen < want) {
      if (/\d/.test(el.value[pos])) seen += 1;
      pos += 1;
    }
    el.setSelectionRange(pos, pos);
  });

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const selStart = input.selectionStart ?? input.value.length;
    caretDigits.current = input.value.slice(0, selStart).replace(/\D/g, "").length;
    setVal(format(input.value));
  }

  return (
    <input
      ref={ref}
      name={name}
      value={val}
      onChange={onChange}
      inputMode="numeric"
      required={required}
      placeholder={placeholder}
      className={className ?? inputCls}
    />
  );
}
