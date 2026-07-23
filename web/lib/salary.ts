import { monthKeyOf } from "./format";

export type SalariedPerson = {
  personType: "office" | "driver";
  personId: string;
  name: string;
  role: string; // chức vụ (office) hoặc "Lái xe"
  baseSalary: number;
};

export type SalaryRow = SalariedPerson & {
  additions: number;
  deductions: number;
  note: string;
  paid: boolean;
  net: number;
};

type OfficeLike = { id: string; name: string; position: string | null; baseSalary: number | null };
type DriverLike = { id: string; name: string; type: string; baseSalary: number | null };
type MonthLike = {
  personType: string;
  personId: string;
  baseSalary: number;
  additions: number;
  deductions: number;
  note: string;
  paid: boolean;
};
type PayoutLike = { workDate: string; amount: number };

/** Thực nhận = lương cơ bản + cộng (thưởng/phụ cấp) − trừ (tạm ứng/khấu trừ). */
export function salaryNet(x: { baseSalary: number; additions: number; deductions: number }): number {
  return x.baseSalary + x.additions - x.deductions;
}

/** Người ăn lương tháng: toàn bộ office + lái xe type="own". */
export function salariedPeople(office: OfficeLike[], drivers: DriverLike[]): SalariedPerson[] {
  const fromOffice: SalariedPerson[] = office.map((p) => ({
    personType: "office",
    personId: p.id,
    name: p.name,
    role: p.position || "Nhân viên",
    baseSalary: p.baseSalary ?? 0,
  }));
  const fromDrivers: SalariedPerson[] = drivers
    .filter((d) => d.type === "own")
    .map((d) => ({
      personType: "driver",
      personId: d.id,
      name: d.name,
      role: "Lái xe",
      baseSalary: d.baseSalary ?? 0,
    }));
  return [...fromOffice, ...fromDrivers];
}

/** Trộn người + bản ghi lương tháng (đã lọc đúng tháng) → dòng có thực nhận. */
export function buildSalaryRows(people: SalariedPerson[], months: MonthLike[]): SalaryRow[] {
  const byKey = new Map(months.map((m) => [`${m.personType}:${m.personId}`, m]));
  return people.map((p) => {
    const m = byKey.get(`${p.personType}:${p.personId}`);
    const baseSalary = m?.baseSalary ?? p.baseSalary; // snapshot nếu đã có dòng tháng
    const additions = m?.additions ?? 0;
    const deductions = m?.deductions ?? 0;
    return {
      ...p,
      baseSalary,
      additions,
      deductions,
      note: m?.note ?? "",
      paid: m?.paid ?? false,
      net: salaryNet({ baseSalary, additions, deductions }),
    };
  });
}

export function partnerPayoutMonthTotal(payouts: PayoutLike[], monthKey: string): number {
  return payouts
    .filter((p) => monthKeyOf(p.workDate) === monthKey)
    .reduce((sum, p) => sum + p.amount, 0);
}

/** Chi phí lương tháng (nối lợi nhuận) = Σ thực nhận + Σ phiếu đối tác trong tháng. */
export function salaryCostForMonth(rows: SalaryRow[], payouts: PayoutLike[], monthKey: string): number {
  const salaried = rows.reduce((sum, r) => sum + r.net, 0);
  return salaried + partnerPayoutMonthTotal(payouts, monthKey);
}

/** Nhân viên thường chỉ thấy dòng lương lái xe; quản lý thấy tất cả. */
export function visibleSalaryRows(rows: SalaryRow[], isManager: boolean): SalaryRow[] {
  return isManager ? rows : rows.filter((r) => r.personType === "driver");
}
