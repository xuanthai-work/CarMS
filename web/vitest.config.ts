import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Test chạy bằng Vite nên KHÔNG tự đọc "paths" trong tsconfig.json; khai lại alias
// "@/*" -> "src/*" để test import được cùng đường dẫn với code app.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
