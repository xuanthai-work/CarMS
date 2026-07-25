import type { Driver as DriverRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Driver } from "@/types";

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

export async function getDrivers(): Promise<Driver[]> {
  const rows = await prisma.driver.findMany({ orderBy: { name: "asc" } });
  return rows.map(toDriver);
}
