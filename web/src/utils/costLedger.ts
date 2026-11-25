import type { FuelEntry, OtherExpense, Trip } from "@/types";
import { otherExpenseCategoryMeta } from "./expenses";
import { monthKeyOf } from "./format";
import { revenueMonthKey } from "./revenue";
import type { SalaryCostBreakdown } from "./salary";

export type CostGroup = "fuel" | "partner" | "toll" | "other" | "salary";

export const COST_GROUPS: { value: CostGroup; label: string }[] = [
  { value: "fuel", label: "Xăng dầu" },
  { value: "partner", label: "Thuê xe đối tác" },
  { value: "toll", label: "Cầu đường" },
  { value: "other", label: "Chi phí khác" },
  { value: "salary", label: "Lương" },
];

export type CostLine = {
  id: string;
  date: string;
  group: CostGroup;
  category: string;
  title: string;
  amount: number;
  paid: boolean | null;
  href: string;
};

export type CostLedger = {
  lines: CostLine[];
  byGroup: Record<CostGroup, number>;
  total: number;
};

const GROUP_ORDER = new Map(COST_GROUPS.map((g, i) => [g.value, i]));

/** Gom mọi khoản chi phí trong tháng (xăng dầu, chi phí khác, chi phí chuyến, lương) vào một sổ thống nhất. */
export function buildCostLedger(input: {
  monthKey: string;
  trips: Trip[];
  fuel: FuelEntry[];
  expenses: OtherExpense[];
  vehicles: { id: string; plate: string }[];
  salary: SalaryCostBreakdown;
}): CostLedger {
  const { monthKey, trips, fuel, expenses, vehicles, salary } = input;
  const lines: CostLine[] = [];
  const push = (line: CostLine) => {
    if (line.amount > 0) lines.push(line);
  };

  const plates = new Map(vehicles.map((v) => [v.id, v.plate]));

  for (const f of fuel) {
    if (monthKeyOf(f.refuelDate) !== monthKey) continue;
    const plate = plates.get(f.vehicleId) ?? "Xe ?";
    const note = f.note.trim();
    push({
      id: `fuel:${f.id}`,
      date: f.refuelDate,
      group: "fuel",
      category: "Xăng dầu",
      title: note ? `${plate} — ${note}` : plate,
      amount: f.amount,
      paid: f.paymentStatus === "paid",
      href: "/tien-dau",
    });
  }

  for (const e of expenses) {
    if (monthKeyOf(e.date) !== monthKey) continue;
    push({
      id: `exp:${e.id}`,
      date: e.date,
      group: e.category === "toll" ? "toll" : "other",
      category: otherExpenseCategoryMeta(e.category).label,
      title: e.title,
      amount: e.amount,
      paid: e.paymentStatus === "paid",
      href: "/chi-phi-khac",
    });
  }

  for (const t of trips) {
    if (revenueMonthKey(t) !== monthKey) continue;
    const date = t.return?.date ?? t.outbound.date;
    const title = t.customerName;
    if (t.partnerCost != null) {
      push({
        id: `trip-partner:${t.id}`,
        date,
        group: "partner",
        category: "Thuê xe đối tác",
        title,
        amount: t.partnerCost,
        paid: null,
        href: "/lich",
      });
    }
    if (t.tollCost != null) {
      push({
        id: `trip-toll:${t.id}`,
        date,
        group: "toll",
        category: "Cầu đường (ghi trên chuyến)",
        title,
        amount: t.tollCost,
        paid: null,
        href: "/lich",
      });
    }
    if (t.otherCost != null) {
      push({
        id: `trip-other:${t.id}`,
        date,
        group: "other",
        category: "Chi phí khác (ghi trên chuyến)",
        title,
        amount: t.otherCost,
        paid: null,
        href: "/lich",
      });
    }
  }

  const salaryDate = `${monthKey}-01`;
  const salaryItems: [string, string, number][] = [
    ["office", "Lương nhân sự văn phòng", salary.office],
    ["monthly", "Lương lái xe tháng", salary.monthlyDrivers],
    ["daily", "Công lái xe đối tác theo ngày", salary.dailyDrivers],
  ];
  for (const [key, label, amount] of salaryItems) {
    push({
      id: `salary:${key}`,
      date: salaryDate,
      group: "salary",
      category: label,
      title: label,
      amount,
      paid: null,
      href: "/luong",
    });
  }

  lines.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (GROUP_ORDER.get(a.group) ?? 0) - (GROUP_ORDER.get(b.group) ?? 0) ||
      a.id.localeCompare(b.id)
  );

  const byGroup: Record<CostGroup, number> = {
    fuel: 0,
    partner: 0,
    toll: 0,
    other: 0,
    salary: 0,
  };
  let total = 0;
  for (const line of lines) {
    byGroup[line.group] += line.amount;
    total += line.amount;
  }

  return { lines, byGroup, total };
}
