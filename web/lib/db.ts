import { prisma } from "./prisma";
import type {
  Vehicle as VehicleRow,
  Driver as DriverRow,
  Trip as TripRow,
  FuelEntry as FuelEntryRow,
  OfficeStaff as OfficeStaffRow,
  SalaryMonth as SalaryMonthRow,
  PartnerPayout as PartnerPayoutRow,
} from "@prisma/client";
import type {
  Vehicle,
  Driver,
  Trip,
  TourType,
  FuelEntry,
  FuelPaymentStatus,
  OfficeStaff,
  SalaryMonth,
  PartnerPayout,
} from "./types";
import { addMonth, monthKeyOf } from "./format";

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
    phone: r.phone,
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
    baseSalary: r.baseSalary,
    note: r.note ?? "",
  };
}

function toOfficeStaff(r: OfficeStaffRow): OfficeStaff {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    position: r.position ?? "",
    baseSalary: r.baseSalary,
    startDate: r.startDate,
    note: r.note ?? "",
    dob: r.dob,
    gender: r.gender,
    email: r.email,
    idNumber: r.idNumber,
    socialInsurance: r.socialInsurance,
    payday: r.payday,
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
    fuelCost: r.fuelCost,
    tollCost: r.tollCost,
    partnerCost: r.partnerCost,
    otherCost: r.otherCost,
    outbound: {
      date: r.outboundDate,
      time: r.outboundTime,
      endTime: r.outboundEndTime,
      from: r.outboundFrom,
      to: r.outboundTo,
      vehicleId: r.outboundVehicleId,
      driverId: r.outboundDriverId,
      seatClass: r.outboundSeatClass,
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
          seatClass: r.returnSeatClass,
        }
      : null,
  };
}

function toFuelEntry(r: FuelEntryRow): FuelEntry {
  return {
    id: r.id,
    vehicleId: r.vehicleId,
    refuelDate: r.refuelDate,
    amount: r.amount,
    paymentStatus: r.paymentStatus as FuelPaymentStatus,
    paymentDate: r.paymentDate,
    payerName: r.payerName,
    note: r.note ?? "",
    source: r.source,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
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

export async function getOfficeStaff(): Promise<OfficeStaff[]> {
  const rows = await prisma.officeStaff.findMany({ orderBy: { name: "asc" } });
  return rows.map(toOfficeStaff);
}

/** Tìm nhân sự văn phòng theo email (không phân biệt hoa/thường) — nối tài khoản đăng nhập. */
export async function getOfficeStaffByEmail(email: string): Promise<OfficeStaff | null> {
  const row = await prisma.officeStaff.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: { id: "asc" }, // ổn định nếu (lỡ) có trùng email; saveOfficeStaff chặn trùng từ đầu
  });
  return row ? toOfficeStaff(row) : null;
}

export async function getTrips(): Promise<Trip[]> {
  // Thứ tự cố định (ngày → giờ đón → id) để xếp tầng lịch không đổi sau mỗi lần sửa.
  const rows = await prisma.trip.findMany({
    orderBy: [{ outboundDate: "asc" }, { outboundTime: "asc" }, { id: "asc" }],
  });
  return rows.map(toTrip);
}

export async function getFuelEntries(monthKey?: string): Promise<FuelEntry[]> {
  const where = monthKey
    ? {
        refuelDate: {
          gte: `${monthKey}-01`,
          lt: `${addMonth(monthKey, 1)}-01`,
        },
      }
    : undefined;
  const rows = await prisma.fuelEntry.findMany({
    where,
    orderBy: [{ refuelDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toFuelEntry);
}

export async function getFuelMonthTotals(monthKey: string): Promise<{
  total: number;
  paid: number;
  unpaid: number;
  count: number;
}> {
  const entries = await getFuelEntries(monthKey);
  return entries.reduce(
    (acc, entry) => {
      acc.total += entry.amount;
      acc.count += 1;
      if (entry.paymentStatus === "paid") acc.paid += entry.amount;
      else acc.unpaid += entry.amount;
      return acc;
    },
    { total: 0, paid: 0, unpaid: 0, count: 0 }
  );
}

/** Tổng tiền dầu theo từng tháng (YYYY-MM) — 1 query, gom ở JS (thay vì N query/tháng). */
export async function getFuelMonthMap(): Promise<Map<string, number>> {
  const rows = await prisma.fuelEntry.findMany({ select: { refuelDate: true, amount: true } });
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = monthKeyOf(r.refuelDate);
    map.set(k, (map.get(k) ?? 0) + r.amount);
  }
  return map;
}

export async function getAvailableFuelMonths(): Promise<string[]> {
  const rows = await prisma.fuelEntry.findMany({
    select: { refuelDate: true },
    distinct: ["refuelDate"],
    orderBy: { refuelDate: "desc" },
  });
  return Array.from(new Set(rows.map((r) => monthKeyOf(r.refuelDate)))).sort().reverse();
}

function toSalaryMonth(r: SalaryMonthRow): SalaryMonth {
  return {
    id: r.id,
    personType: r.personType as SalaryMonth["personType"],
    personId: r.personId,
    monthKey: r.monthKey,
    baseSalary: r.baseSalary,
    additions: r.additions,
    deductions: r.deductions,
    note: r.note ?? "",
    paid: r.paid,
    paidDate: r.paidDate,
  };
}

function toPartnerPayout(r: PartnerPayoutRow): PartnerPayout {
  return {
    id: r.id,
    driverId: r.driverId,
    workDate: r.workDate,
    amount: r.amount,
    paymentStatus: r.paymentStatus as PartnerPayout["paymentStatus"],
    paymentDate: r.paymentDate,
    payerName: r.payerName,
    note: r.note ?? "",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getSalaryMonths(monthKey?: string): Promise<SalaryMonth[]> {
  const rows = await prisma.salaryMonth.findMany({
    where: monthKey ? { monthKey } : undefined,
  });
  return rows.map(toSalaryMonth);
}

export async function getPartnerPayouts(monthKey?: string): Promise<PartnerPayout[]> {
  const where = monthKey
    ? { workDate: { gte: `${monthKey}-01`, lt: `${addMonth(monthKey, 1)}-01` } }
    : undefined;
  const rows = await prisma.partnerPayout.findMany({
    where,
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toPartnerPayout);
}

/** Sinh id có tiền tố (v/d/t) cho bản ghi mới. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)
    .toString(36)
    .padStart(3, "0")}`;
}
