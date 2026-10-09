"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor, requireManagerEditor } from "@/services/auth";
import { s, optStr, optNum } from "@/utils/formData";
import { newId } from "@/utils/id";
import { tourTypeFromDates } from "@/utils/trips";
import { revalidateAll } from "./revalidate";

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
  await requireEditor();
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
    partnerCost: optNum(fd, "partnerCost"),
    // tollCost/otherCost không còn nhập ở form: chỉ ghi khi có trong FormData để
    // không xoá mất dữ liệu lịch sử của các chuyến cũ khi sửa.
    ...(fd.has("tollCost") ? { tollCost: optNum(fd, "tollCost") } : {}),
    ...(fd.has("otherCost") ? { otherCost: optNum(fd, "otherCost") } : {}),
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
  const tripId = id || newId("t");
  if (id) {
    await prisma.trip.update({ where: { id }, data });
  } else {
    await prisma.trip.create({ data: { id: tripId, ...data } });
  }
  await syncPartnerDebt(tripId, data.outboundVehicleId, data.returnVehicleId, data.partnerCost, data.outboundDate);
  revalidateAll();
}

/**
 * Đồng bộ phiếu công nợ tiền thuê đối tác theo chuyến.
 * - Có xe đối tác + partnerCost > 0  → tạo/cập nhật 1 phiếu (giữ nguyên trạng thái đã trả).
 * - Ngược lại (xe nhà / partnerCost = 0) → xoá phiếu nếu có.
 * Khi tripId rỗng (chuyến mới chưa tạo) thì bỏ qua.
 */
async function syncPartnerDebt(
  tripId: string,
  outboundVehicleId: string | null,
  returnVehicleId: string | null,
  partnerCost: number | null,
  outboundDate: string
): Promise<void> {
  if (!tripId) return;
  const selectedVehIds = [outboundVehicleId, returnVehicleId].filter(Boolean) as string[];
  const partnerVehs = selectedVehIds.length
    ? await prisma.vehicle.findMany({
        where: { id: { in: selectedVehIds }, type: "partner" },
        select: { plate: true },
      })
    : [];

  const hasPartnerVeh = partnerVehs.length > 0;
  const cost = partnerCost ?? 0;

  if (hasPartnerVeh && cost > 0) {
    const partnerName = partnerVehs.map((v) => v.plate).join(", ");
    const existingDebt = await prisma.partnerDebt.findUnique({ where: { tripId } });
    if (existingDebt) {
      await prisma.partnerDebt.update({
        where: { tripId },
        data: { partnerName, workDate: outboundDate, amount: cost },
      });
    } else {
      await prisma.partnerDebt.create({
        data: {
          id: newId("pd"),
          tripId,
          partnerName,
          workDate: outboundDate,
          amount: cost,
          paymentStatus: "unpaid",
        },
      });
    }
  } else {
    await prisma.partnerDebt.deleteMany({ where: { tripId } });
  }
}

export async function deleteTrip(fd: FormData): Promise<void> {
  await requireEditor();
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
  await requireEditor();
  await prisma.trip.update({
    where: { id },
    data: kind === "ret" ? { returnEndTime: endTime } : { outboundEndTime: endTime },
  });
  revalidateAll();
}

/** Đổi trạng thái 1 chuyến (từ dropdown trạng thái ở màn Doanh thu). */
export async function setTripStatus(id: string, status: string): Promise<void> {
  await requireManagerEditor();
  await prisma.trip.update({ where: { id }, data: { status } });
  revalidateAll();
}
