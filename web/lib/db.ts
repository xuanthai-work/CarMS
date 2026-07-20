import fs from "fs";
import path from "path";
import type { DB } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "db.json");
const seedFile = path.join(dataDir, "seed.json");

/**
 * Store JSON tại chỗ cho prototype. Lần đầu đọc sẽ copy seed.json -> db.json,
 * từ đó mọi thay đổi ghi vào db.json (đã .gitignore).
 * Production sẽ thay lớp này bằng PostgreSQL + Prisma, giữ nguyên chữ ký hàm.
 */
export function readDb(): DB {
  if (!fs.existsSync(dbFile)) {
    const seed = fs.readFileSync(seedFile, "utf-8");
    fs.writeFileSync(dbFile, seed, "utf-8");
  }
  const raw = fs.readFileSync(dbFile, "utf-8");
  return JSON.parse(raw) as DB;
}

export function writeDb(db: DB): void {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), "utf-8");
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)
    .toString(36)
    .padStart(3, "0")}`;
}
