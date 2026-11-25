import { describe, expect, it } from "vitest";
import type { FuelEntry, OtherExpense, Trip } from "@/types";
import { buildCostLedger } from "./costLedger";
import { monthKeyOf } from "./format";
import { buildMonthFinance } from "./revenue";
import type { SalaryCostBreakdown } from "./salary";

function makeTrip(over: Partial<Trip> & { id: string; outboundDate: string; returnDate?: string | null }): Trip {
  const { id, outboundDate, returnDate = null, ...rest } = over;
  const leg = (date: string) => ({
    date,
    time: null,
    endTime: null,
    from: "A",
    to: "B",
    vehicleId: null,
    driverId: null,
    seatClass: null,
  });
  return {
    id,
    customerName: `Khách ${id}`,
    customerPhone: null,
    tourType: returnDate ? "2n1d" : "oneway",
    price: 1_000_000,
    deposit: null,
    cancelFee: null,
    status: "pending",
    heldThroughTour: false,
    note: "",
    tollCost: null,
    partnerCost: null,
    otherCost: null,
    outbound: leg(outboundDate),
    return: returnDate ? leg(returnDate) : null,
    ...rest,
  };
}

function makeFuel(over: Partial<FuelEntry> & { id: string; refuelDate: string; amount: number }): FuelEntry {
  return {
    vehicleId: "v1",
    paymentStatus: "paid",
    paymentDate: over.refuelDate,
    payerName: "",
    note: "",
    source: "manual",
    ...over,
  };
}

function makeExpense(
  over: Partial<OtherExpense> & { id: string; date: string; category: string; amount: number }
): OtherExpense {
  return {
    title: `Chi ${over.id}`,
    paymentStatus: "unpaid",
    paymentDate: null,
    payerName: "",
    note: "",
    ...over,
  };
}

const ZERO_SALARY: SalaryCostBreakdown = {
  office: 0,
  monthlyDrivers: 0,
  dailyDrivers: 0,
  total: 0,
};

describe("buildCostLedger", () => {
  it("bất biến: ledger.total khớp đúng buildMonthFinance(...).totalCost với dữ liệu hỗn hợp", () => {
    const trips: Trip[] = [
      makeTrip({
        id: "t1",
        outboundDate: "2026-09-10",
        tollCost: 150_000,
        partnerCost: 2_000_000,
        otherCost: 100_000,
      }),
      makeTrip({
        id: "t2",
        outboundDate: "2026-09-15",
        status: "cancelled",
        cancelFee: 500_000,
        partnerCost: 800_000,
      }),
      makeTrip({
        id: "t3",
        outboundDate: "2026-08-30",
        tollCost: 999_000,
        partnerCost: 9_999_000,
      }),
    ];

    const fuel: FuelEntry[] = [
      makeFuel({ id: "f1", refuelDate: "2026-09-05", amount: 500_000, note: "Đổ đầy" }),
      makeFuel({ id: "f2", refuelDate: "2026-09-20", amount: 700_000, paymentStatus: "unpaid" }),
      makeFuel({ id: "f3", refuelDate: "2026-10-01", amount: 300_000 }),
    ];

    const expenses: OtherExpense[] = [
      makeExpense({ id: "e1", date: "2026-09-03", category: "toll", amount: 120_000 }),
      makeExpense({ id: "e2", date: "2026-09-04", category: "maintenance", amount: 450_000 }),
      makeExpense({ id: "e3", date: "2026-09-06", category: "washing", amount: 80_000 }),
      makeExpense({ id: "e4", date: "2026-09-07", category: "parking", amount: 60_000 }),
      makeExpense({ id: "e5", date: "2026-09-08", category: "fine_insurance", amount: 300_000 }),
      makeExpense({ id: "e6", date: "2026-09-09", category: "other", amount: 90_000 }),
      makeExpense({ id: "e7", date: "2026-08-15", category: "other", amount: 999_000 }),
    ];

    const salary: SalaryCostBreakdown = {
      office: 10_000_000,
      monthlyDrivers: 8_000_000,
      dailyDrivers: 1_200_000,
      total: 19_200_000,
    };

    const monthKey = "2026-09";
    const fuelTotal = fuel
      .filter((f) => monthKeyOf(f.refuelDate) === monthKey)
      .reduce((s, f) => s + f.amount, 0);
    const otherExpenseTotal = expenses
      .filter((e) => monthKeyOf(e.date) === monthKey)
      .reduce((s, e) => s + e.amount, 0);

    const ledger = buildCostLedger({
      monthKey,
      trips,
      fuel,
      expenses,
      vehicles: [{ id: "v1", plate: "29A-12345" }],
      salary,
    });
    const finance = buildMonthFinance(trips, monthKey, fuelTotal, salary.total, otherExpenseTotal);

    expect(ledger.total).toBe(finance.totalCost);
    expect(ledger.byGroup.fuel).toBe(fuelTotal);
    expect(ledger.byGroup.partner).toBe(finance.tripCosts.partner);
    expect(ledger.byGroup.toll + ledger.byGroup.other).toBe(finance.otherCostTotal);
    expect(ledger.byGroup.salary).toBe(salary.total);
  });

  it("chuyến cancelled vẫn được tính chi phí (có dòng trip-partner:<id>)", () => {
    const ledger = buildCostLedger({
      monthKey: "2026-09",
      trips: [
        makeTrip({
          id: "c1",
          outboundDate: "2026-09-12",
          status: "cancelled",
          cancelFee: 200_000,
          partnerCost: 600_000,
        }),
      ],
      fuel: [],
      expenses: [],
      vehicles: [],
      salary: ZERO_SALARY,
    });

    expect(ledger.lines).toHaveLength(1);
    expect(ledger.lines[0]).toMatchObject({
      id: "trip-partner:c1",
      group: "partner",
      amount: 600_000,
      paid: null,
      href: "/lich",
    });
  });

  it("bỏ dòng amount <= 0 / null; tháng trống trả mảng rỗng và byGroup đủ 5 khoá bằng 0", () => {
    const ledger = buildCostLedger({
      monthKey: "2026-09",
      trips: [makeTrip({ id: "t0", outboundDate: "2026-09-01", partnerCost: 0, tollCost: null })],
      fuel: [makeFuel({ id: "f0", refuelDate: "2026-09-01", amount: 0 })],
      expenses: [makeExpense({ id: "e0", date: "2026-09-01", category: "other", amount: -100 })],
      vehicles: [],
      salary: ZERO_SALARY,
    });

    expect(ledger.lines).toEqual([]);
    expect(ledger.total).toBe(0);
    expect(ledger.unpaid).toBe(0);
    expect(ledger.byGroup).toEqual({ fuel: 0, partner: 0, toll: 0, other: 0, salary: 0 });
  });

  it("OtherExpense loại toll vào group toll, loại khác vào other và category dùng nhãn tiếng Việt", () => {
    const ledger = buildCostLedger({
      monthKey: "2026-09",
      trips: [],
      fuel: [],
      expenses: [
        makeExpense({ id: "e-toll", date: "2026-09-10", category: "toll", amount: 100_000 }),
        makeExpense({ id: "e-maint", date: "2026-09-11", category: "maintenance", amount: 200_000 }),
      ],
      vehicles: [],
      salary: ZERO_SALARY,
    });

    const tollLine = ledger.lines.find((l) => l.id === "exp:e-toll");
    const maintLine = ledger.lines.find((l) => l.id === "exp:e-maint");
    expect(tollLine).toMatchObject({ group: "toll", category: "Cầu đường / VETC" });
    expect(maintLine).toMatchObject({ group: "other", category: "Bảo dưỡng & Sửa xe" });
  });

  it("sắp xếp date giảm dần và mọi id duy nhất", () => {
    const ledger = buildCostLedger({
      monthKey: "2026-09",
      trips: [makeTrip({ id: "t1", outboundDate: "2026-09-10", partnerCost: 100_000, tollCost: 50_000 })],
      fuel: [makeFuel({ id: "f1", refuelDate: "2026-09-25", amount: 300_000 })],
      expenses: [makeExpense({ id: "e1", date: "2026-09-05", category: "other", amount: 80_000 })],
      vehicles: [{ id: "v1", plate: "29A-12345" }],
      salary: { office: 1_000_000, monthlyDrivers: 0, dailyDrivers: 0, total: 1_000_000 },
    });

    const dates = ledger.lines.map((l) => l.date);
    expect(dates).toEqual(["2026-09-25", "2026-09-10", "2026-09-10", "2026-09-05", "2026-09-01"]);
    const ids = ledger.lines.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fuel với xe không có trong vehicles thì title bắt đầu bằng 'Xe ?'", () => {
    const ledger = buildCostLedger({
      monthKey: "2026-09",
      trips: [],
      fuel: [makeFuel({ id: "f-unknown", vehicleId: "missing", refuelDate: "2026-09-02", amount: 250_000, note: "Ghi chú" })],
      expenses: [],
      vehicles: [],
      salary: ZERO_SALARY,
    });

    expect(ledger.lines[0].title).toBe("Xe ? — Ghi chú");
  });

  it("điền đúng kind, refId, vehicleId cho từng nguồn", () => {
    const ledger = buildCostLedger({
      monthKey: "2026-09",
      trips: [makeTrip({ id: "t9", outboundDate: "2026-09-10", partnerCost: 500_000, tollCost: 50_000, otherCost: 30_000 })],
      fuel: [makeFuel({ id: "f9", vehicleId: "v2", refuelDate: "2026-09-11", amount: 400_000 })],
      expenses: [makeExpense({ id: "e9", date: "2026-09-12", category: "other", amount: 100_000 })],
      vehicles: [{ id: "v2", plate: "30B-99999" }],
      salary: { office: 5_000_000, monthlyDrivers: 0, dailyDrivers: 0, total: 5_000_000 },
    });

    const byId = new Map(ledger.lines.map((l) => [l.id, l]));
    expect(byId.get("fuel:f9")).toMatchObject({ kind: "fuel", refId: "f9", vehicleId: "v2" });
    expect(byId.get("exp:e9")).toMatchObject({ kind: "expense", refId: "e9", vehicleId: null });
    expect(byId.get("trip-partner:t9")).toMatchObject({ kind: "trip", refId: "t9", vehicleId: null });
    expect(byId.get("trip-toll:t9")).toMatchObject({ kind: "trip", refId: "t9", vehicleId: null });
    expect(byId.get("trip-other:t9")).toMatchObject({ kind: "trip", refId: "t9", vehicleId: null });
    expect(byId.get("salary:office")).toMatchObject({ kind: "salary", refId: null, vehicleId: null });
  });

  it("tính unpaid chỉ gồm phiếu dầu và chi phí khác chưa chi trong tháng", () => {
    const ledger = buildCostLedger({
      monthKey: "2026-09",
      trips: [
        makeTrip({ id: "t1", outboundDate: "2026-09-10", partnerCost: 2_000_000, tollCost: 150_000 }),
        makeTrip({ id: "t2", outboundDate: "2026-08-10", partnerCost: 900_000 }),
      ],
      fuel: [
        makeFuel({ id: "f1", refuelDate: "2026-09-05", amount: 500_000, paymentStatus: "paid" }),
        makeFuel({ id: "f2", refuelDate: "2026-09-20", amount: 700_000, paymentStatus: "unpaid" }),
        makeFuel({ id: "f3", refuelDate: "2026-10-01", amount: 300_000, paymentStatus: "unpaid" }),
      ],
      expenses: [
        makeExpense({ id: "e1", date: "2026-09-03", category: "toll", amount: 120_000 }),
        makeExpense({ id: "e2", date: "2026-09-04", category: "maintenance", amount: 450_000 }),
        makeExpense({ id: "e3", date: "2026-09-06", category: "washing", amount: 80_000 }),
        makeExpense({ id: "e4", date: "2026-09-07", category: "parking", amount: 60_000 }),
        makeExpense({ id: "e5", date: "2026-09-08", category: "fine_insurance", amount: 300_000 }),
        makeExpense({ id: "e6", date: "2026-09-09", category: "other", amount: 90_000 }),
        makeExpense({ id: "e-paid", date: "2026-09-10", category: "other", amount: 200_000, paymentStatus: "paid" }),
        makeExpense({ id: "e-prev", date: "2026-08-15", category: "other", amount: 999_000 }),
      ],
      vehicles: [{ id: "v1", plate: "29A-12345" }],
      salary: { office: 10_000_000, monthlyDrivers: 0, dailyDrivers: 0, total: 10_000_000 },
    });

    // f2 (700k) + e1..e6 (120k + 450k + 80k + 60k + 300k + 90k = 1.100k) = 1.800k
    expect(ledger.unpaid).toBe(1_800_000);
  });
});
