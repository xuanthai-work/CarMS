import type { Vehicle as VehicleRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Vehicle } from "@/types";

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

export async function getVehicles(): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({ orderBy: { plate: "asc" } });
  return rows.map(toVehicle);
}
