"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { newId } from "./db";
import { tourTypeFromDates } from "./trips";

function s(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function optStr(fd: FormData, key: string): string | null {
  const v = s(fd, key);
  return v === "" ? null : v;
}

function optNum(fd: FormData, key: string): number | null {
  const v = s(fd, key).replace(/[^\d]/g, "");
  return v === "" ? null : Number(v);
}

function reqNum(fd: FormData, key: string): number {
  const v = optNum(fd, key);
  if (v == null) throw new Error(`Thiếu số cho trường ${key}`);
  return v;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/lich");
  revalidatePath("/xe");
  revalidatePath("/nhan-su");
  revalidatePath("/doanh-thu");
  revalidatePath("/tien-dau");
}

export async function saveVehicle(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  const data = {
    plate: s(fd, "plate"),
    seats: Number(s(fd, "seats")) || null,
    status: s(fd, "status") || "active",
    type: s(fd, "type") || "own",
    inspectionDue: optStr(fd, "inspectionDue"),
    insuranceDue: optStr(fd, "insuranceDue"),
    note: s(fd, "note"),
  };
  if (id) {
    await prisma.vehicle.update({ where: { id }, data });
  } else {
    await prisma.vehicle.create({ data: { id: newId("v"), ...data } });
  }
  revalidateAll();
}

export async function deleteVehicle(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  await prisma.vehicle.delete({ where: { id } });
  revalidateAll();
}

/** Tạo nhanh 1 xe (chỉ biển số) từ combobox trong form chuyến — mặc định "cộng tác ngoài"; sửa sau ở trang Xe. */
export async function quickCreateVehicle(plate: string): Promise<{ id: string; label: string }> {
  const p = plate.trim();
  const id = newId("v");
  await prisma.vehicle.create({ data: { id, plate: p, status: "active", type: "partner" } });
  revalidateAll();
  return { id, label: p };
}

/** Tạo nhanh 1 lái xe (chỉ tên) từ combobox trong form chuyến — mặc định "cộng tác ngoài". */
export async function quickCreateDriver(name: string): Promise<{ id: string; label: string }> {
  const n = name.trim();
  const id = newId("d");
  await prisma.driver.create({ data: { id, name: n, type: "partner" } });
  revalidateAll();
  return { id, label: n };
}

export async function saveDriver(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  const data = {
    name: s(fd, "name"),
    phone: optStr(fd, "phone"),
    licenseClass: s(fd, "licenseClass"),
    type: s(fd, "type") || "own",
    note: s(fd, "note"),
  };
  if (id) {
    await prisma.driver.update({ where: { id }, data });
  } else {
    await prisma.driver.create({ data: { id: newId("d"), ...data } });
  }
  revalidateAll();
}

export async function deleteDriver(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  await prisma.driver.delete({ where: { id } });
  revalidateAll();
}

/** Ghép các cột phẳng của một lượt (đi = "o", về = "r") từ FormData. */
function legFields(fd: FormData, prefix: string) {
  // Ô "Xe" mang id xe thật, hoặc "seat:<n>" = placeholder số chỗ (chưa xếp xe cụ thể).
  const rawVeh = optStr(fd, `${prefix}_vehicleId`);
  const seatClass = rawVeh?.startsWith("seat:") ? Number(rawVeh.slice(5)) || null : null;
  return {
    date: s(fd, `${prefix}_date`),
    time: optStr(fd, `${prefix}_time`),
    from: s(fd, `${prefix}_from`),
    to: s(fd, `${prefix}_to`),
    vehicleId: seatClass != null ? null : rawVeh, // placeholder ⇒ không gán xe thật
    seatClass,
    driverId: optStr(fd, `${prefix}_driverId`),
  };
}

export async function saveTrip(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  const hasReturn = s(fd, "hasReturn") === "on";
  const o = legFields(fd, "o");
  const r = hasReturn ? legFields(fd, "r") : null;
  const data = {
    customerName: s(fd, "customerName"),
    customerPhone: optStr(fd, "customerPhone"),
    tourType: tourTypeFromDates(o.date, r?.date ?? null),
    price: optNum(fd, "price"),
    deposit: optNum(fd, "deposit"),
    fuelCost: optNum(fd, "fuelCost"),
    tollCost: optNum(fd, "tollCost"),
    partnerCost: optNum(fd, "partnerCost"),
    otherCost: optNum(fd, "otherCost"),
    status: (s(fd, "status") || "pending") as "pending" | "info_sent" | "completed_paid",
    heldThroughTour: s(fd, "heldThroughTour") === "on",
    note: s(fd, "note"),
    outboundDate: o.date,
    outboundTime: o.time,
    outboundFrom: o.from,
    outboundTo: o.to,
    outboundVehicleId: o.vehicleId,
    outboundDriverId: o.driverId,
    outboundSeatClass: o.seatClass,
    hasReturn,
    returnDate: r?.date ?? null,
    returnTime: r?.time ?? null,
    returnFrom: r?.from ?? null,
    returnTo: r?.to ?? null,
    returnVehicleId: r?.vehicleId ?? null,
    returnDriverId: r?.driverId ?? null,
    returnSeatClass: r?.seatClass ?? null,
  };
  if (id) {
    await prisma.trip.update({ where: { id }, data });
  } else {
    await prisma.trip.create({ data: { id: newId("t"), ...data } });
  }
  revalidateAll();
}

export async function deleteTrip(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  await prisma.trip.delete({ where: { id } });
  revalidateAll();
}

/** Đặt giờ đến (endTime) cho 1 lượt — dùng khi kéo mép dưới thẻ ở lịch theo xe. */
export async function setLegEndTime(
  id: string,
  kind: "out" | "ret",
  endTime: string | null
): Promise<void> {
  await prisma.trip.update({
    where: { id },
    data: kind === "ret" ? { returnEndTime: endTime } : { outboundEndTime: endTime },
  });
  revalidateAll();
}

/** Đổi trạng thái 1 chuyến (từ dropdown trạng thái ở màn Doanh thu). */
export async function setTripStatus(id: string, status: string): Promise<void> {
  await prisma.trip.update({ where: { id }, data: { status } });
  revalidateAll();
}

export async function saveFuelEntry(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  const paymentStatus = (s(fd, "paymentStatus") || "unpaid") as "paid" | "unpaid";
  const vehicleId = s(fd, "vehicleId");
  const refuelDate = s(fd, "refuelDate");
  if (!vehicleId) throw new Error("Thiếu xe cho phiếu dầu");
  if (!refuelDate) throw new Error("Thiếu ngày đổ");
  const paymentDate = paymentStatus === "paid" ? optStr(fd, "paymentDate") ?? refuelDate : null;
  const data = {
    vehicleId,
    refuelDate,
    amount: reqNum(fd, "amount"),
    paymentStatus,
    paymentDate,
    payerName: s(fd, "payerName"),
    note: s(fd, "note"),
  };
  if (id) {
    await prisma.fuelEntry.update({ where: { id }, data });
  } else {
    await prisma.fuelEntry.create({ data: { id: newId("f"), source: "manual", ...data } });
  }
  revalidateAll();
}

export async function deleteFuelEntry(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  await prisma.fuelEntry.delete({ where: { id } });
  revalidateAll();
}
