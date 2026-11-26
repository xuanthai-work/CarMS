import { monthKeyOf } from "./format";

export type SalariedPerson = {
  personType: "office" | "driver";
  personId: string;
  name: string;
  role: string; // chức vụ (office) hoặc "Lái xe"
  baseSalary: number;
  payday?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  monthKey?: string;
  rates?: { effectiveFrom: string; amount: number }[];
};

export type SalaryRow = SalariedPerson & {
  additions: number;
  deductions: number;
  advances: number;
  workDays: number;
  earned: number;
  locked: boolean;
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
  startDate?: string | null;
  endDate?: string | null;
};
type DriverLike = {
  id: string;
  name: string;
  type: string;
  baseSalary: number | null;
  startDate?: string | null;
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
  locked?: boolean;
  workDays?: number | null;
  earned?: number | null;
  advances?: number | null;
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

function workBounds(
  monthKey: string,
  startDate?: string | null,
  endDate?: string | null
): { from: string; to: string; workDays: number } {
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const monthStart = `${monthKey}-01`;
  const monthEnd = `${monthKey}-${String(lastDay).padStart(2, "0")}`;
  const from = startDate && startDate > monthStart ? startDate : monthStart;
  const to = endDate && endDate < monthEnd ? endDate : monthEnd;
  if (from > to) return { from, to, workDays: 0 };
  const workDays = Number(to.slice(8, 10)) - Number(from.slice(8, 10)) + 1;
  return { from, to, workDays };
}

/** Số ngày lịch làm việc trong tháng M (tính cả ngày vào và ngày nghỉ). */
export function workedDays(
  monthKey: string,
  startDate?: string | null,
  endDate?: string | null
): number {
  return workBounds(monthKey, startDate, endDate).workDays;
}

function rateAtDate(
  sortedRates: { effectiveFrom: string; amount: number }[],
  date: string,
  fallback: number
): number {
  let best = fallback;
  for (const r of sortedRates) {
    if (r.effectiveFrom <= date) best = r.amount;
    else break;
  }
  return best;
}

/**
 * Tính lương theo công (25 ngày công/tháng, tối đa 25):
 * nếu trong khoảng làm có đổi mức `SalaryRate`, chia đoạn theo `effectiveFrom`
 * và tính `round(Σ(r_i × d_i) × min(25, D) / (25 × D))`.
 */
export function computeEarned(input: {
  monthKey: string;
  startDate?: string | null;
  endDate?: string | null;
  rates: { effectiveFrom: string; amount: number }[];
  fallbackBase: number;
}): { workDays: number; credit: number; earned: number } {
  const { from, to, workDays } = workBounds(input.monthKey, input.startDate, input.endDate);
  if (workDays === 0) return { workDays: 0, credit: 0, earned: 0 };
  const credit = Math.min(25, workDays);
  if (input.rates.length === 0) {
    return { workDays, credit, earned: Math.round((input.fallbackBase * credit) / 25) };
  }

  const byDate = new Map<string, number>();
  for (const r of [...input.rates].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))) {
    byDate.set(r.effectiveFrom, r.amount);
  }
  const sorted = Array.from(byDate, ([effectiveFrom, amount]) => ({ effectiveFrom, amount }));
  const splits = [from, ...sorted.map((r) => r.effectiveFrom).filter((d) => d > from && d <= to)];
  const toDay = Number(to.slice(8, 10));

  let weightedSum = 0;
  for (let i = 0; i < splits.length; i++) {
    const segStart = splits[i];
    const startDay = Number(segStart.slice(8, 10));
    const endDay = i + 1 < splits.length ? Number(splits[i + 1].slice(8, 10)) - 1 : toDay;
    const d_i = endDay - startDay + 1;
    weightedSum += rateAtDate(sorted, segStart, input.fallbackBase) * d_i;
  }

  return {
    workDays,
    credit,
    earned: Math.round((weightedSum * credit) / (25 * workDays)),
  };
}

/** Thực nhận = lương theo công + cộng (thưởng/phụ cấp) − khấu trừ khác − tạm ứng. */
export function salaryNet(x: {
  baseSalary: number;
  earned?: number;
  additions: number;
  deductions: number;
  advances?: number;
}): number {
  return (x.earned ?? x.baseSalary) + x.additions - x.deductions - (x.advances ?? 0);
}

/**
 * Người ăn lương tháng: toàn bộ office + lái xe type="own".
 * Nếu có monthKey: bỏ người có endDate thuộc tháng TRƯỚC monthKey hoặc startDate thuộc tháng SAU monthKey.
 */
export function salariedPeople(
  office: OfficeLike[],
  drivers: DriverLike[],
  monthKey?: string,
  rates: RateLike[] = []
): SalariedPerson[] {
  const isEmployedInMonth = (p: { startDate?: string | null; endDate?: string | null }) =>
    !monthKey ||
    ((!p.endDate || monthKeyOf(p.endDate) >= monthKey) &&
      (!p.startDate || monthKeyOf(p.startDate) <= monthKey));

  const personRatesFor = (personType: "office" | "driver", personId: string) =>
    rates
      .filter((r) => r.personType === personType && r.personId === personId)
      .map((r) => ({ effectiveFrom: r.effectiveFrom, amount: r.amount }));

  const endRef = (p: { startDate?: string | null; endDate?: string | null }) => {
    if (!monthKey) return "";
    const { to, workDays } = workBounds(monthKey, p.startDate, p.endDate);
    return workDays > 0 ? to : `${monthKey}-01`;
  };

  const fullBase = (
    pRates: { effectiveFrom: string; amount: number }[],
    refDate: string,
    fallback: number
  ) => {
    if (!monthKey || pRates.length === 0) return fallback;
    const sorted = [...pRates].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
    return rateAtDate(sorted, refDate, fallback);
  };

  const fromOffice: SalariedPerson[] = office
    .filter(isEmployedInMonth)
    .map((p) => {
      const pRates = personRatesFor("office", p.id);
      return {
        personType: "office",
        personId: p.id,
        name: p.name,
        role: p.position || "Nhân viên",
        baseSalary: fullBase(pRates, endRef(p), p.baseSalary ?? 0),
        payday: p.payday ?? null,
        startDate: p.startDate ?? null,
        endDate: p.endDate ?? null,
        monthKey,
        rates: pRates,
      };
    });
  const fromDrivers: SalariedPerson[] = drivers
    .filter((d) => d.type === "own" && isEmployedInMonth(d))
    .map((d) => {
      const dRates = personRatesFor("driver", d.id);
      return {
        personType: "driver",
        personId: d.id,
        name: d.name,
        role: "Lái xe",
        baseSalary: fullBase(dRates, endRef(d), d.baseSalary ?? 0),
        payday: null,
        startDate: d.startDate ?? null,
        endDate: d.endDate ?? null,
        monthKey,
        rates: dRates,
      };
    });
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
    const additions = m?.additions ?? 0;
    const deductions = m?.deductions ?? 0;
    const isLocked = Boolean(m?.locked && m.earned != null);

    let baseSalary: number;
    let personAdvances: number;
    let workDays: number;
    let earned: number;

    if (isLocked && m && m.earned != null) {
      baseSalary = m.baseSalary;
      workDays = m.workDays ?? 25;
      earned = m.earned;
      personAdvances = m.advances ?? 0;
    } else {
      const pRates = p.rates ?? [];
      // Người không có rate: giữ snapshot `m?.baseSalary` của dòng tháng để không đổi số tháng cũ.
      baseSalary = pRates.length > 0 ? p.baseSalary : (m?.baseSalary ?? p.baseSalary);
      personAdvances = advByKey.get(k) ?? 0;
      workDays = 25;
      earned = baseSalary;
      if (p.monthKey) {
        const calc = computeEarned({
          monthKey: p.monthKey,
          startDate: p.startDate,
          endDate: p.endDate,
          rates: pRates,
          fallbackBase: baseSalary,
        });
        workDays = calc.workDays;
        earned = calc.earned;
      }
    }

    return {
      ...p,
      baseSalary,
      additions,
      deductions,
      advances: personAdvances,
      workDays,
      earned,
      locked: isLocked,
      note: m?.note ?? "",
      paid: m?.paid ?? false,
      paidDate: m?.paidDate ?? null,
      net: salaryNet({ baseSalary, earned, additions, deductions, advances: personAdvances }),
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
