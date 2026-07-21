import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Nạp dữ liệu từ data/seed.json (được `parse_to_seed.py` extract từ Excel) vào DB.
 *  - Xe & lái xe: upsert (idempotent).
 *  - Chuyến: dựng từ `bookings` (dữ liệu thật của Excel), rồi THAY TOÀN BỘ bảng Trip
 *    (xoá hết rồi chèn lại) — chạy lại luôn khớp Excel. rawText gốc được giữ ở ghi chú.
 */

const dir = path.dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(path.join(dir, "..", "data", "seed.json"), "utf-8"));

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Thiếu DATABASE_URL/DIRECT_URL — xem .env.example");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

function vehicleRow(v) {
  return {
    id: v.id,
    plate: v.plate,
    seats: v.seats ?? null,
    status: v.status ?? "active",
    type: v.type ?? "own",
    inspectionDue: v.inspectionDue ?? null,
    insuranceDue: v.insuranceDue ?? null,
    note: v.note ?? null,
  };
}

function driverRow(d) {
  return {
    id: d.id,
    name: d.name,
    phone: (d.phone ?? d.zalo) ?? null,
    licenseClass: d.licenseClass ?? null,
    type: d.type ?? "own",
    note: d.note ?? null,
  };
}

// ----- Excel booking -> Trip -----
const TOUR_BY_DAYS = { 1: "1d", 2: "2n1d", 3: "3n2d", 4: "4n3d" };
function tourTypeOf(days) {
  return TOUR_BY_DAYS[Math.min(Math.max(days || 1, 1), 4)];
}

/** Tách "HN - Cát Bà 3N2Đ, 30/6-2/7" -> { from: "HN", to: "Cát Bà" } (best-effort). */
function splitRoute(route) {
  if (!route) return { from: "", to: "" };
  const clean = (s) =>
    s
      .replace(/\s*\d+\s*N\s*\d+\s*Đ.*$/i, "") // bỏ đuôi "3N2Đ, ..."
      .replace(/,\s*\d.*$/, "") // bỏ đuôi ", 30/6-2/7"
      .trim();
  const parts = route.split(/\s-\s/);
  if (parts.length < 2) return { from: "", to: clean(route) || route.trim() };
  return { from: parts[0].trim(), to: clean(parts.slice(1).join(" - ")) };
}

function bookingToTrip(b) {
  const isRound = b.leg === "round";
  const hasReturn = isRound && (b.days || 1) > 1; // round nhiều ngày: giữ xe, có lượt về ở endDate
  const { from, to } = splitRoute(b.route);
  const noteParts = [];
  if (b.isOutsourced) noteParts.push("Giao đối tác" + (b.partnerName ? `: ${b.partnerName}` : ""));
  if (b.rawText) noteParts.push(b.rawText);
  return {
    id: `t-${b.id}`,
    customerName: b.customerName || "(chưa rõ)",
    customerPhone: b.phone ?? null,
    tourType: tourTypeOf(b.days),
    price: b.price ?? null,
    deposit: b.deposit ?? null,
    status: "pending",
    heldThroughTour: hasReturn,
    note: noteParts.join(" | "),
    outboundDate: b.date,
    outboundTime: b.time ?? null,
    outboundFrom: from,
    outboundTo: to,
    outboundVehicleId: b.vehicleId ?? null,
    outboundDriverId: b.driverId ?? null,
    hasReturn,
    returnDate: hasReturn ? b.endDate : null,
    returnTime: null,
    returnFrom: hasReturn ? to : null,
    returnTo: hasReturn ? from : null,
    returnVehicleId: hasReturn ? (b.vehicleId ?? null) : null,
    returnDriverId: hasReturn ? (b.driverId ?? null) : null,
  };
}

async function main() {
  // Xe & lái xe trước (chuyến tham chiếu tới id của chúng); song song trong mỗi nhóm.
  await Promise.all(
    (seed.vehicles ?? []).map((v) => {
      const row = vehicleRow(v);
      return prisma.vehicle.upsert({ where: { id: row.id }, create: row, update: row });
    })
  );
  await Promise.all(
    (seed.drivers ?? []).map((d) => {
      const row = driverRow(d);
      return prisma.driver.upsert({ where: { id: row.id }, create: row, update: row });
    })
  );

  // Chuyến: dựng từ bookings rồi thay toàn bộ (1 lần createMany thay vì N create).
  const trips = (seed.bookings ?? []).map(bookingToTrip);
  await prisma.trip.deleteMany({});
  await prisma.trip.createMany({ data: trips });

  const [v, d, t] = await Promise.all([
    prisma.vehicle.count(),
    prisma.driver.count(),
    prisma.trip.count(),
  ]);
  console.log(`Seed xong: ${v} xe, ${d} lái xe, ${t} chuyến (từ ${(seed.bookings ?? []).length} booking Excel).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
