"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { newId } from "./db";
import type { TourType } from "./types";

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
  return {
    date: s(fd, `${prefix}_date`),
    time: optStr(fd, `${prefix}_time`),
    from: s(fd, `${prefix}_from`),
    to: s(fd, `${prefix}_to`),
    vehicleId: optStr(fd, `${prefix}_vehicleId`), // "" → null (chưa gán / giao đối tác)
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
    tourType: (s(fd, "tourType") || "1d") as TourType,
    price: optNum(fd, "price"),
    deposit: optNum(fd, "deposit"),
    status: (s(fd, "status") || "pending") as "pending" | "info_sent" | "completed_paid",
    heldThroughTour: s(fd, "heldThroughTour") === "on",
    note: s(fd, "note"),
    outboundDate: o.date,
    outboundTime: o.time,
    outboundFrom: o.from,
    outboundTo: o.to,
    outboundVehicleId: o.vehicleId,
    outboundDriverId: o.driverId,
    hasReturn,
    returnDate: r?.date ?? null,
    returnTime: r?.time ?? null,
    returnFrom: r?.from ?? null,
    returnTo: r?.to ?? null,
    returnVehicleId: r?.vehicleId ?? null,
    returnDriverId: r?.driverId ?? null,
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
