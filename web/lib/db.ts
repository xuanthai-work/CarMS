import { prisma } from "./prisma";
import type {
  Vehicle as VehicleRow,
  Driver as DriverRow,
  Trip as TripRow,
} from "@prisma/client";
import type { Vehicle, Driver, Trip, TourType } from "./types";

/**
 * Tầng đọc dữ liệu (Postgres/Supabase qua Prisma).
 * Prisma lưu lượt đi/về ở dạng cột phẳng (outboundDate, returnDate, ...); các mapper
 * dưới đây chuyển về đúng model của app (Trip có outbound/return lồng nhau).
 */

function toVehicle(r: VehicleRow): Vehicle {
  return {
    id: r.id,
    plate: r.plate,
    seats: r.seats,
    status: r.status,
    type: r.type,
    inspectionDue: r.inspectionDue,
    insuranceDue: r.insuranceDue,
    note: r.note ?? "",
  };
}

function toDriver(r: DriverRow): Driver {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    licenseClass: r.licenseClass ?? "",
    type: r.type,
    note: r.note ?? "",
  };
}

function toTrip(r: TripRow): Trip {
  return {
    id: r.id,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    tourType: r.tourType as TourType,
    price: r.price,
    deposit: r.deposit,
    status: r.status as Trip["status"],
    heldThroughTour: r.heldThroughTour,
    note: r.note ?? "",
    outbound: {
      date: r.outboundDate,
      time: r.outboundTime,
      endTime: r.outboundEndTime,
      from: r.outboundFrom,
      to: r.outboundTo,
      vehicleId: r.outboundVehicleId,
      driverId: r.outboundDriverId,
    },
    return: r.hasReturn
      ? {
          date: r.returnDate ?? "",
          time: r.returnTime,
          endTime: r.returnEndTime,
          from: r.returnFrom ?? "",
          to: r.returnTo ?? "",
          vehicleId: r.returnVehicleId,
          driverId: r.returnDriverId,
        }
      : null,
  };
}

export async function getVehicles(): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({ orderBy: { plate: "asc" } });
  return rows.map(toVehicle);
}

export async function getDrivers(): Promise<Driver[]> {
  const rows = await prisma.driver.findMany({ orderBy: { name: "asc" } });
  return rows.map(toDriver);
}

export async function getTrips(): Promise<Trip[]> {
  // Thứ tự cố định (ngày → giờ đón → id) để xếp tầng lịch không đổi sau mỗi lần sửa.
  const rows = await prisma.trip.findMany({
    orderBy: [{ outboundDate: "asc" }, { outboundTime: "asc" }, { id: "asc" }],
  });
  return rows.map(toTrip);
}

/** Sinh id có tiền tố (v/d/t) cho bản ghi mới. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)
    .toString(36)
    .padStart(3, "0")}`;
}
