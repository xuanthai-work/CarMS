import { useState } from "react";

/**
 * State cho form dạng object mà các trường đi qua component tự làm
 * (SelectMenu / DatePicker / MoneyInput…). Gom chung mẫu lặp ở các thẻ thêm/sửa:
 *  - `set(key)` trả về onChange cho một trường
 *  - `reset()` đưa về giá trị khởi tạo (dùng khi Huỷ / sau khi Thêm)
 *
 * `init` là hàm (lazy) để giá trị đầu suy từ props hiện tại.
 */
export function useFormState<T extends object>(init: () => T) {
  const [form, setForm] = useState<T>(init);
  const set =
    <K extends keyof T>(key: K) =>
    (value: T[K]) =>
      setForm((f) => ({ ...f, [key]: value }));
  const reset = () => setForm(init());
  return { form, set, reset };
}
