import { monthKeyOf } from "./format";

export type SalariedPerson = {
  personType: "office" | "driver";
  personId: string;
  name: string;
  role: string; // chức vụ (office) hoặc "Lái xe"
  baseSalary: number;
  payday?: number | null;
};

export type SalaryRow = SalariedPerson & {
  additions: number;
  deductions: number;
  advances: number;
  note: string;
  paid: boolean;
  paidDate?: string | null;
  net: number;
};

type OfficeLike = {
  id: string;
  name: string;
  position: string | null;
  baseSalary: number | null;
  payday?: number | null;
  endDate?: string | null;
};
type DriverLike = {
  id: string;
  name: string;
  type: string;
  baseSalary: number | null;
  endDate?: string | null;
};
type MonthLike = {
  personType: string;
  personId: string;
  baseSalary: number;
  additions: number;
  deductions: number;
  note: string;
  paid: boolean;
  paidDate?: string | null;
};
type PayoutLike = { workDate: string; amount: number };
type AdvanceLike = { personType: string; personId: string; amount: number };
export type RateLike = { personType: string; personId: string; effectiveFrom: string; amount: number };

/**
 * Mức lương cơ bản của một tháng = rate có `effectiveFrom` lớn nhất mà `effectiveFrom <= ${monthKey}-01`.
 * Không có rate nào thỏa → dùng `fallback` (lương hiện lưu trên người).
 */
export function resolveBaseSalary(
  rates: RateLike[],
  personType: string,
  personId: string,
  monthKey: string,
  fallback: number
): number {
  const start = `${monthKey}-01`;
  let best: RateLike | null = null;
  for (const r of rates) {
    if (r.personType !== personType || r.personId !== personId) continue;
    if (r.effectiveFrom <= start && (!best || r.effectiveFrom >= best.effectiveFrom)) {
      best = r;
    }
  }
  return best ? best.amount : fallback;
}

export type SalaryCostBreakdown = {
  office: number;
  monthlyDrivers: number;
  dailyDrivers: number;
  total: number;
};

/** Thực nhận = lương cơ bản + cộng (thưởng/phụ cấp) − khấu trừ khác − tạm ứng. */
export function salaryNet(x: {
  baseSalary: number;
  additions: number;
  deductions: number;
  advances?: number;
}): number {
  return x.baseSalary + x.additions - x.deductions - (x.advances ?? 0);
}

/**
 * Người ăn lương tháng: toàn bộ office + lái xe type="own".
 * Nếu có monthKey: bỏ người có endDate thuộc tháng TRƯỚC monthKey (nghỉ từ tháng sau ngày nghỉ).
 */
export function salariedPeople(
  office: OfficeLike[],
  drivers: DriverLike[],
  monthKey?: string,
  rates: RateLike[] = []
): SalariedPerson[] {
  const isEmployedInMonth = (p: { endDate?: string | null }) =>
    !monthKey || !p.endDate || monthKeyOf(p.endDate) >= monthKey;

  const fromOffice: SalariedPerson[] = office
    .filter(isEmployedInMonth)
    .map((p) => ({
      personType: "office",
      personId: p.id,
      name: p.name,
      role: p.position || "Nhân viên",
      baseSalary:
        monthKey && rates.length > 0
          ? resolveBaseSalary(rates, "office", p.id, monthKey, p.baseSalary ?? 0)
          : p.baseSalary ?? 0,
      payday: p.payday ?? null,
    }));
  const fromDrivers: SalariedPerson[] = drivers
    .filter((d) => d.type === "own" && isEmployedInMonth(d))
    .map((d) => ({
      personType: "driver",
      personId: d.id,
      name: d.name,
      role: "Lái xe",
      baseSalary:
        monthKey && rates.length > 0
          ? resolveBaseSalary(rates, "driver", d.id, monthKey, d.baseSalary ?? 0)
          : d.baseSalary ?? 0,
      payday: null,
    }));
  return [...fromOffice, ...fromDrivers];
}

/** Trộn người + bản ghi lương tháng (đã lọc đúng tháng) + tạm ứng trong tháng → dòng có thực nhận. */
export function buildSalaryRows(
  people: SalariedPerson[],
  months: MonthLike[],
  advances: AdvanceLike[] = []
): SalaryRow[] {
  const byKey = new Map(months.map((m) => [`${m.personType}:${m.personId}`, m]));
  const advByKey = new Map<string, number>();
  for (const a of advances) {
    const k = `${a.personType}:${a.personId}`;
    advByKey.set(k, (advByKey.get(k) ?? 0) + a.amount);
  }
  return people.map((p) => {
    const k = `${p.personType}:${p.personId}`;
    const m = byKey.get(k);
    const baseSalary = m?.baseSalary ?? p.baseSalary; // snapshot nếu đã có dòng tháng
    const additions = m?.additions ?? 0;
    const deductions = m?.deductions ?? 0;
    const personAdvances = advByKey.get(k) ?? 0;
    return {
      ...p,
      baseSalary,
      additions,
      deductions,
      advances: personAdvances,
      note: m?.note ?? "",
      paid: m?.paid ?? false,
      paidDate: m?.paidDate ?? null,
      net: salaryNet({ baseSalary, additions, deductions, advances: personAdvances }),
    };
  });
}

export function partnerPayoutMonthTotal(payouts: PayoutLike[], monthKey: string): number {
  return payouts
    .filter((p) => monthKeyOf(p.workDate) === monthKey)
    .reduce((sum, p) => sum + p.amount, 0);
}

/** Tách chi phí lương theo nhân viên, lái xe tháng và lái xe nhận công theo ngày. */
export function salaryCostBreakdownForMonth(
  rows: SalaryRow[],
  payouts: PayoutLike[],
  monthKey: string
): SalaryCostBreakdown {
  const office = rows
    .filter((row) => row.personType === "office")
    .reduce((sum, row) => sum + row.net, 0);
  const monthlyDrivers = rows
    .filter((row) => row.personType === "driver")
    .reduce((sum, row) => sum + row.net, 0);
  const dailyDrivers = partnerPayoutMonthTotal(payouts, monthKey);
  return {
    office,
    monthlyDrivers,
    dailyDrivers,
    total: office + monthlyDrivers + dailyDrivers,
  };
}

/** Chi phí lương tháng (nối lợi nhuận) = tổng của ba nhóm lương. */
export function salaryCostForMonth(rows: SalaryRow[], payouts: PayoutLike[], monthKey: string): number {
  return salaryCostBreakdownForMonth(rows, payouts, monthKey).total;
}

/**
 * Chi phí lương mọi tháng trong `monthKeys` (office + lái xe tháng + công lái xe theo ngày).
 * Mỗi tháng dùng đúng đường tính của trang Lương: salariedPeople(…, monthKey) → buildSalaryRows(chỉ dòng tháng đó) → salaryCostBreakdownForMonth.
 */
export function salaryCostByMonth(
  office: OfficeLike[],
  drivers: DriverLike[],
  months: (MonthLike & { monthKey: string })[],
  payouts: PayoutLike[],
  monthKeys: string[],
  advances: (AdvanceLike & { date: string })[] = [],
  rates: RateLike[] = []
): Record<string, SalaryCostBreakdown> {
  const result: Record<string, SalaryCostBreakdown> = {};
  for (const monthKey of monthKeys) {
    const people = salariedPeople(office, drivers, monthKey, rates);
    const monthRows = months.filter((m) => m.monthKey === monthKey);
    const monthAdvances = advances.filter((a) => monthKeyOf(a.date) === monthKey);
    const rows = buildSalaryRows(people, monthRows, monthAdvances);
    result[monthKey] = salaryCostBreakdownForMonth(rows, payouts, monthKey);
  }
  return result;
}

/** Nhân viên thường chỉ thấy dòng lương lái xe; quản lý thấy tất cả. */
export function visibleSalaryRows(rows: SalaryRow[], isManager: boolean): SalaryRow[] {
  return isManager ? rows : rows.filter((r) => r.personType === "driver");
}
