"use server";

import { revalidatePath } from "next/cache";
import { readDb, writeDb, newId } from "./db";

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

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/lich");
  revalidatePath("/xe");
  revalidatePath("/nhan-su");
}

export async function saveVehicle(fd: FormData): Promise<void> {
  const db = readDb();
  const id = s(fd, "id");
  const data = {
    plate: s(fd, "plate"),
    seats: Number(s(fd, "seats")) || null,
    status: s(fd, "status") || "active",
    inspectionDue: optStr(fd, "inspectionDue"),
    insuranceDue: optStr(fd, "insuranceDue"),
    note: s(fd, "note"),
  };
  if (id) {
    const idx = db.vehicles.findIndex((v) => v.id === id);
    if (idx >= 0) db.vehicles[idx] = { ...db.vehicles[idx], ...data, id };
  } else {
    db.vehicles.push({ id: newId("v"), ...data });
  }
  writeDb(db);
  revalidateAll();
}

export async function deleteVehicle(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  const db = readDb();
  db.vehicles = db.vehicles.filter((v) => v.id !== id);
  writeDb(db);
  revalidateAll();
}

export async function saveDriver(fd: FormData): Promise<void> {
  const db = readDb();
  const id = s(fd, "id");
  const data = {
    name: s(fd, "name"),
    phone: optStr(fd, "phone"),
    zalo: optStr(fd, "zalo"),
    licenseClass: s(fd, "licenseClass"),
    type: s(fd, "type") || "own",
    note: s(fd, "note"),
  };
  if (id) {
    const idx = db.drivers.findIndex((d) => d.id === id);
    if (idx >= 0) db.drivers[idx] = { ...db.drivers[idx], ...data, id };
  } else {
    db.drivers.push({ id: newId("d"), ...data });
  }
  writeDb(db);
  revalidateAll();
}

export async function deleteDriver(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  const db = readDb();
  db.drivers = db.drivers.filter((d) => d.id !== id);
  writeDb(db);
  revalidateAll();
}

/** Đọc 1 lượt từ FormData theo tiền tố ("o" = đi, "r" = về). */
function leg(fd: FormData, prefix: string) {
  return {
    date: s(fd, `${prefix}_date`),
    time: optStr(fd, `${prefix}_time`),
    from: s(fd, `${prefix}_from`),
    to: s(fd, `${prefix}_to`),
    vehicleId: s(fd, `${prefix}_vehicleId`),
    driverId: s(fd, `${prefix}_driverId`),
  };
}

export async function saveTrip(fd: FormData): Promise<void> {
  const db = readDb();
  if (!db.trips) db.trips = [];
  const id = s(fd, "id");
  const hasReturn = s(fd, "hasReturn") === "on";
  const data = {
    customerName: s(fd, "customerName"),
    customerPhone: optStr(fd, "customerPhone"),
    tourType: (s(fd, "tourType") || "1d") as import("./types").TourType,
    price: optNum(fd, "price"),
    deposit: optNum(fd, "deposit"),
    status: (s(fd, "status") || "pending") as "pending" | "info_sent" | "completed_paid",
    heldThroughTour: s(fd, "heldThroughTour") === "on",
    note: s(fd, "note"),
    outbound: leg(fd, "o"),
    return: hasReturn ? leg(fd, "r") : null,
  };
  if (id) {
    const idx = db.trips.findIndex((t) => t.id === id);
    if (idx >= 0) db.trips[idx] = { ...db.trips[idx], ...data, id };
  } else {
    db.trips.push({ id: newId("t"), ...data });
  }
  writeDb(db);
  revalidateAll();
}

export async function deleteTrip(fd: FormData): Promise<void> {
  const id = s(fd, "id");
  const db = readDb();
  db.trips = (db.trips ?? []).filter((t) => t.id !== id);
  writeDb(db);
  revalidateAll();
}
