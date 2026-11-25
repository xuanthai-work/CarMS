"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor, requireManagerEditor } from "@/services/auth";
import { s, optStr, optNum } from "@/utils/formData";
import { newId } from "@/utils/id";
import { tourTypeFromDates, tripFinishDate } from "@/utils/trips";
import { revalidateAll } from "./revalidate";
import { OK, fail, type ActionResult } from "@/utils/actionResult";

/** Ghép các cột phẳng của một lượt (đi = "o", về = "r") từ FormData. */
function legFields(fd: FormData, prefix: string) {
  // Ô "Xe" mang id xe thật, hoặc "seat:<n>" = placeholder số chỗ (chưa xếp xe cụ thể).
  const rawVeh = optStr(fd, `${prefix}_vehicleId`);
  const seatClass = rawVeh?.startsWith("seat:") ? Number(rawVeh.slice(5)) || null : null;
  return {
    date: s(fd, `${prefix}_date`),
    time: optStr(fd, `${prefix}_time`),
    from: "",
    to: "",
    vehicleId: seatClass != null ? null : rawVeh, // placeholder ⇒ không gán xe thật
    seatClass,
    driverId: optStr(fd, `${prefix}_driverId`),
  };
}

export async function saveTrip(fd: FormData): Promise<ActionResult> {
  try {
    await requireEditor();
  } catch {
    return fail("Bạn không có quyền sửa dữ liệu hoặc phiên đăng nhập đã hết. Hãy đăng nhập lại.");
  }
  const id = s(fd, "id");
  const hasReturn = s(fd, "hasReturn") === "on";
  const o = legFields(fd, "o");
  const r = hasReturn ? legFields(fd, "r") : null;
  const customerName = s(fd, "customerName");

  if (!customerName.trim()) return fail("Vui lòng nhập tên khách.");
  if (!o.date.trim()) return fail("Vui lòng chọn ngày đi.");
  if (hasReturn && !r?.date?.trim()) return fail("Vui lòng chọn ngày về.");

  const status = (s(fd, "status") || "pending") as "pending" | "info_sent" | "completed_paid" | "cancelled";

  const data = {
    customerName,
    ...(fd.has("customerPhone") ? { customerPhone: optStr(fd, "customerPhone") } : {}),
    tourType: tourTypeFromDates(o.date, r?.date ?? null),
    price: optNum(fd, "price"),
    deposit: optNum(fd, "deposit"),
    cancelFee: status === "cancelled" ? optNum(fd, "cancelFee") ?? 0 : null,
    partnerCost: optNum(fd, "partnerCost"),
    // tollCost/otherCost không còn nhập ở form: chỉ ghi khi có trong FormData để
    // không xoá mất dữ liệu lịch sử của các chuyến cũ khi sửa.
    ...(fd.has("tollCost") ? { tollCost: optNum(fd, "tollCost") } : {}),
    ...(fd.has("otherCost") ? { otherCost: optNum(fd, "otherCost") } : {}),
    status,
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
    returnFrom: r ? "" : null,
    returnTo: r ? "" : null,
    returnVehicleId: r?.vehicleId ?? null,
    returnDriverId: r?.driverId ?? null,
    returnSeatClass: r?.seatClass ?? null,
  };
  const tripId = id || newId("t");
  try {
    if (id) {
      await prisma.trip.update({ where: { id }, data });
    } else {
      await prisma.trip.create({ data: { id: tripId, ...data } });
    }
    await syncPartnerDebt(
      tripId,
      data.outboundVehicleId,
      data.returnVehicleId,
      data.partnerCost,
      tripFinishDate(data.outboundDate, data.returnDate)
    );
  } catch (e) {
    console.error("saveTrip failed", e);
    return fail("Không lưu được chuyến. Vui lòng thử lại; nếu vẫn lỗi hãy tải lại trang.");
  }
  revalidateAll();
  return OK;
}

/**
 * Đồng bộ phiếu công nợ tiền thuê đối tác theo chuyến.
 * - Có xe đối tác + partnerCost > 0  → tạo/cập nhật 1 phiếu (giữ nguyên trạng thái đã trả).
 * - workDate = ngày hoàn tất của chuyến (returnDate ?? outboundDate).
 * - Ngược lại (xe nhà / partnerCost = 0) → xoá phiếu nếu có.
 * Khi tripId rỗng (chuyến mới chưa tạo) thì bỏ qua.
 */
async function syncPartnerDebt(
  tripId: string,
  outboundVehicleId: string | null,
  returnVehicleId: string | null,
  partnerCost: number | null,
  workDate: string
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
        data: { partnerName, workDate, amount: cost },
      });
    } else {
      await prisma.partnerDebt.create({
        data: {
          id: newId("pd"),
          tripId,
          partnerName,
          workDate,
          amount: cost,
          paymentStatus: "unpaid",
        },
      });
    }
  } else {
    await prisma.partnerDebt.deleteMany({ where: { tripId } });
  }
}

export async function deleteTrip(fd: FormData): Promise<ActionResult> {
  try {
    await requireEditor();
  } catch {
    return fail("Bạn không có quyền sửa dữ liệu hoặc phiên đăng nhập đã hết. Hãy đăng nhập lại.");
  }
  const id = s(fd, "id");
  try {
    await prisma.trip.delete({ where: { id } });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && (e as { code?: unknown }).code === "P2025") {
      revalidateAll();
      return OK;
    }
    console.error("deleteTrip failed", e);
    return fail("Không xóa được chuyến. Vui lòng thử lại.");
  }
  revalidateAll();
  return OK;
}

/** Đổi trạng thái 1 chuyến (từ dropdown trạng thái ở màn Doanh thu). */
export async function setTripStatus(id: string, status: string): Promise<void> {
  await requireManagerEditor();
  await prisma.trip.update({ where: { id }, data: { status } });
  revalidateAll();
}
