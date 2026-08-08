import { describe, expect, it } from "vitest";
import type { Trip } from "../types";
import { buildMonthFinance } from "./revenue";
import { salaryCostBreakdownForMonth, type SalaryRow } from "./salary";

function trip(overrides: Partial<Trip> & Pick<Trip, "id" | "price">): Trip {
  const { id, price, ...rest } = overrides;
  return {
    id,
    customerName: `Khách ${id}`,
    customerPhone: null,
    tourType: "oneway",
    price,
    deposit: null,
    status: "pending",
    heldThroughTour: false,
    note: "",
    tollCost: null,
    partnerCost: null,
    otherCost: null,
    outbound: {
      date: "2026-08-01",
      time: null,
      endTime: null,
      from: "A",
      to: "B",
      vehicleId: null,
      driverId: null,
      seatClass: null,
    },
    return: null,
    ...rest,
  };
}

describe("tài chính toàn hệ thống trong một tháng", () => {
  it("mỗi nguồn doanh thu và chi phí chỉ được cộng đúng một lần", () => {
    const trips = [
      trip({
        id: "completed-own-vehicle",
        price: 10_000_000,
        deposit: 2_000_000,
        status: "completed_paid",
        tollCost: 500_000,
        otherCost: 200_000,
      }),
      trip({
        id: "pending-partner-vehicle",
        price: 8_000_000,
        deposit: 3_000_000,
        partnerCost: 4_000_000,
      }),
      trip({
        id: "completed-next-month",
        price: 6_000_000,
        partnerCost: 1_000_000,
        status: "completed_paid",
        tourType: "2n1d",
        return: {
          date: "2026-09-01",
          time: null,
          endTime: null,
          from: "B",
          to: "A",
          vehicleId: null,
          driverId: null,
          seatClass: null,
        },
      }),
    ];
    const salaryRows: SalaryRow[] = [
      { personType: "office", personId: "office", name: "NV", role: "Nhân viên", baseSalary: 11_000_000, additions: 0, deductions: 0, note: "", paid: true, net: 11_000_000 },
      { personType: "driver", personId: "driver", name: "LX", role: "Lái xe", baseSalary: 9_000_000, additions: 0, deductions: 0, note: "", paid: true, net: 9_000_000 },
    ];
    const payouts = [
      { workDate: "2026-08-15", amount: 1_500_000 },
      { workDate: "2026-09-01", amount: 700_000 },
    ];
    const salary = salaryCostBreakdownForMonth(salaryRows, payouts, "2026-08");
    const finance = buildMonthFinance(trips, "2026-08", 2_000_000, salary.total);

    expect(finance.rows.map((row) => row.trip.id)).toEqual([
      "completed-own-vehicle",
      "pending-partner-vehicle",
    ]);
    expect(finance.summary).toMatchObject({
      recognized: 18_000_000,
      collected: 13_000_000,
      outstanding: 5_000_000,
      cost: 4_700_000,
      count: 2,
    });
    expect(finance.tripCosts).toEqual({ other: 700_000, partner: 4_000_000 });
    expect(salary).toEqual({
      office: 11_000_000,
      monthlyDrivers: 9_000_000,
      dailyDrivers: 1_500_000,
      total: 21_500_000,
    });
    expect(finance.paidTotal).toBe(10_000_000);
    expect(finance.totalCost).toBe(28_200_000);
    expect(finance.profit).toBe(-10_200_000);
    expect(finance.totalCost).toBe(
      finance.tripCosts.other +
        finance.tripCosts.partner +
        2_000_000 +
        salary.office +
        salary.monthlyDrivers +
        salary.dailyDrivers
    );
  });
});
