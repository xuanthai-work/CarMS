export const STORAGE_KEYS = {
  model: "carms.assistant.model",
  instructions: "carms.assistant.instructions",
  messages: "carms.assistant.messages",
} as const;

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage đầy / bị chặn → bỏ qua */
  }
}
