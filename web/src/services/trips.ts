import type { Trip as TripRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Trip, TourType } from "@/types";

/**
 * Prisma lưu lượt đi/về ở dạng cột phẳng (outboundDate, returnDate, ...);
 * mapper dưới đây chuyển về đúng model của app (Trip có outbound/return lồng nhau).
 */
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

export async function getTrips(): Promise<Trip[]> {
  // Thứ tự cố định (ngày → giờ đón → id) để xếp tầng lịch không đổi sau mỗi lần sửa.
  const rows = await prisma.trip.findMany({
    orderBy: [{ outboundDate: "asc" }, { outboundTime: "asc" }, { id: "asc" }],
  });
  return rows.map(toTrip);
}
