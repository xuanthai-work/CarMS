export type ActionResult = { ok: true } | { ok: false; error: string };

export const OK: ActionResult = { ok: true };

export function fail(error: string): ActionResult {
  return { ok: false, error };
}

/**
 * Nếu `e` là lỗi vi phạm ràng buộc duy nhất của Prisma (mã P2002) thì trả về tên các trường vi phạm
 * (ví dụ ["plate"]); ngược lại null. Phòng thủ nhiều dạng vì driver adapter có thể đổi cấu trúc `meta`:
 * 1) e.meta.target là mảng chuỗi hoặc chuỗi; 2) e.meta.driverAdapterError.cause.constraint.fields;
 * 3) tách từ thông điệp: "Unique constraint failed on the fields: (`plate`)".
 */
export function uniqueViolationFields(e: unknown): string[] | null {
  if (typeof e !== "object" || e === null) return null;

  const err = e as {
    code?: unknown;
    message?: unknown;
    meta?: {
      target?: unknown;
      driverAdapterError?: {
        cause?: {
          constraint?: {
            fields?: unknown;
          };
        };
      };
    };
  };

  if (err.code !== "P2002") return null;

  // 1) e.meta.target
  const target = err.meta?.target;
  if (Array.isArray(target)) {
    return target.map(String);
  }
  if (typeof target === "string" && target.length > 0) {
    return [target];
  }

  // 2) e.meta.driverAdapterError.cause.constraint.fields
  const adapterFields = err.meta?.driverAdapterError?.cause?.constraint?.fields;
  if (Array.isArray(adapterFields)) {
    return adapterFields.map(String);
  }
  if (typeof adapterFields === "string" && adapterFields.length > 0) {
    return [adapterFields];
  }

  // 3) Phân tích từ message: "Unique constraint failed on the fields: (`plate`)"
  if (typeof err.message === "string") {
    const match = err.message.match(/Unique constraint failed on the fields?:\s*\(([^)]+)\)/i);
    if (match && match[1]) {
      const parsed = match[1]
        .split(",")
        .map((s) => s.trim().replace(/^[`'"]+|[`'"]+$/g, ""))
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
  }

  // Thuộc mã P2002 nhưng không bóc tách được trường cụ thể
  return [];
}
