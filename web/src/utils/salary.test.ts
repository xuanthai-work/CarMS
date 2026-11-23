import { describe, it, expect } from "vitest";
import {
  salaryNet,
  salariedPeople,
  buildSalaryRows,
  partnerPayoutMonthTotal,
  salaryCostBreakdownForMonth,
  salaryCostForMonth,
  visibleSalaryRows,
  type SalaryRow,
} from "./salary";

describe("salaryNet", () => {
  it("thực nhận = base + cộng - trừ", () => {
    expect(salaryNet({ baseSalary: 10_000_000, additions: 2_000_000, deductions: 500_000 })).toBe(11_500_000);
  });
});

describe("salariedPeople", () => {
  it("gồm mọi office + chỉ lái xe own khi không có endDate", () => {
    const office = [{ id: "o1", name: "An", position: "COO", baseSalary: 20_000_000 }];
    const drivers = [
      { id: "d1", name: "Ba", type: "own", baseSalary: 12_000_000 },
      { id: "d2", name: "Tư", type: "partner", baseSalary: null },
    ];
    const people = salariedPeople(office, drivers);
    expect(people.map((p) => p.personId)).toEqual(["o1", "d1"]);
    expect(people[0]).toMatchObject({ personType: "office", role: "COO", baseSalary: 20_000_000 });
    expect(people[1]).toMatchObject({ personType: "driver", role: "Lái xe", baseSalary: 12_000_000 });
  });

  it("không truyền monthKey → không lọc dù có endDate", () => {
    const office = [{ id: "o1", name: "An", position: "COO", baseSalary: 20_000_000, endDate: "2026-09-15" }];
    const drivers = [{ id: "d1", name: "Ba", type: "own", baseSalary: 12_000_000, endDate: "2026-09-15" }];
    const people = salariedPeople(office, drivers);
    expect(people.map((p) => p.personId)).toEqual(["o1", "d1"]);
  });

  it("office có endDate = 2026-09-15: có mặt ở 2026-08, 2026-09; vắng ở 2026-10", () => {
    const office = [{ id: "o1", name: "An", position: "COO", baseSalary: 20_000_000, endDate: "2026-09-15" }];
    const drivers = [{ id: "d1", name: "Ba", type: "own", baseSalary: 12_000_000 }];
    expect(salariedPeople(office, drivers, "2026-08").map((p) => p.personId)).toEqual(["o1", "d1"]);
    expect(salariedPeople(office, drivers, "2026-09").map((p) => p.personId)).toEqual(["o1", "d1"]);
    expect(salariedPeople(office, drivers, "2026-10").map((p) => p.personId)).toEqual(["d1"]);
  });

  it("driver own có endDate cùng quy tắc; driver partner vẫn bị loại", () => {
    const office = [{ id: "o1", name: "An", position: "COO", baseSalary: 20_000_000 }];
    const drivers = [
      { id: "d1", name: "Ba", type: "own", baseSalary: 12_000_000, endDate: "2026-09-15" },
      { id: "d2", name: "Tư", type: "partner", baseSalary: null, endDate: "2026-09-15" },
    ];
    expect(salariedPeople(office, drivers, "2026-09").map((p) => p.personId)).toEqual(["o1", "d1"]);
    expect(salariedPeople(office, drivers, "2026-10").map((p) => p.personId)).toEqual(["o1"]);
  });

  it("tích hợp: buildSalaryRows và salaryCostBreakdownForMonth không tính lương người đã nghỉ ở tháng sau", () => {
    const office = [{ id: "o1", name: "An", position: "COO", baseSalary: 20_000_000, endDate: "2026-09-15" }];
    const drivers = [{ id: "d1", name: "Ba", type: "own", baseSalary: 12_000_000 }];
    const people = salariedPeople(office, drivers, "2026-10");
    const rows = buildSalaryRows(people, []);
    expect(rows.map((r) => r.personId)).toEqual(["d1"]);
    const breakdown = salaryCostBreakdownForMonth(rows, [], "2026-10");
    expect(breakdown.office).toBe(0);
    expect(breakdown.monthlyDrivers).toBe(12_000_000);
    expect(breakdown.total).toBe(12_000_000);
  });
});

describe("buildSalaryRows", () => {
  it("không có bản ghi tháng → base từ hồ sơ, add/ded = 0, chưa trả", () => {
    const people = [{ personType: "office" as const, personId: "o1", name: "An", role: "COO", baseSalary: 20_000_000 }];
    const [row] = buildSalaryRows(people, []);
    expect(row).toMatchObject({ additions: 0, deductions: 0, paid: false, net: 20_000_000 });
  });
  it("có bản ghi tháng → dùng snapshot + điều chỉnh", () => {
    const people = [{ personType: "driver" as const, personId: "d1", name: "Ba", role: "Lái xe", baseSalary: 12_000_000 }];
    const months = [{ personType: "driver", personId: "d1", baseSalary: 12_000_000, additions: 1_000_000, deductions: 2_000_000, note: "tạm ứng", paid: true }];
    const [row] = buildSalaryRows(people, months);
    expect(row.net).toBe(11_000_000);
    expect(row.paid).toBe(true);
  });
});

describe("partnerPayoutMonthTotal", () => {
  it("chỉ cộng phiếu có workDate trong tháng", () => {
    const payouts = [
      { workDate: "2026-07-03", amount: 800_000 },
      { workDate: "2026-07-20", amount: 900_000 },
      { workDate: "2026-08-01", amount: 500_000 },
    ];
    expect(partnerPayoutMonthTotal(payouts, "2026-07")).toBe(1_700_000);
  });
});

describe("salaryCostForMonth", () => {
  it("tổng = Σ thực nhận + Σ phiếu đối tác trong tháng", () => {
    const rows: SalaryRow[] = [
      { personType: "office", personId: "o1", name: "An", role: "COO", baseSalary: 20_000_000, additions: 0, deductions: 0, note: "", paid: false, net: 20_000_000 },
      { personType: "driver", personId: "d1", name: "Ba", role: "Lái xe", baseSalary: 12_000_000, additions: 0, deductions: 0, note: "", paid: false, net: 12_000_000 },
    ];
    const payouts = [{ workDate: "2026-07-10", amount: 1_500_000 }];
    expect(salaryCostForMonth(rows, payouts, "2026-07")).toBe(33_500_000);
  });

  it("tách đúng lương nhân viên, lái xe tháng và lái xe ngày", () => {
    const rows: SalaryRow[] = [
      { personType: "office", personId: "o1", name: "An", role: "COO", baseSalary: 20_000_000, additions: 0, deductions: 0, note: "", paid: false, net: 20_000_000 },
      { personType: "driver", personId: "d1", name: "Ba", role: "Lái xe", baseSalary: 12_000_000, additions: 0, deductions: 0, note: "", paid: false, net: 12_000_000 },
    ];
    const payouts = [
      { workDate: "2026-07-10", amount: 1_500_000 },
      { workDate: "2026-08-01", amount: 700_000 },
    ];

    expect(salaryCostBreakdownForMonth(rows, payouts, "2026-07")).toEqual({
      office: 20_000_000,
      monthlyDrivers: 12_000_000,
      dailyDrivers: 1_500_000,
      total: 33_500_000,
    });
  });
});

describe("visibleSalaryRows", () => {
  const rows: SalaryRow[] = [
    { personType: "office", personId: "o1", name: "An", role: "COO", baseSalary: 0, additions: 0, deductions: 0, note: "", paid: false, net: 0 },
    { personType: "driver", personId: "d1", name: "Ba", role: "Lái xe", baseSalary: 0, additions: 0, deductions: 0, note: "", paid: false, net: 0 },
  ];
  it("quản lý thấy tất cả", () => {
    expect(visibleSalaryRows(rows, true)).toHaveLength(2);
  });
  it("nhân viên chỉ thấy lái xe", () => {
    const v = visibleSalaryRows(rows, false);
    expect(v).toHaveLength(1);
    expect(v[0].personType).toBe("driver");
  });
});
