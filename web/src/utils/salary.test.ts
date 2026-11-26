import { describe, it, expect } from "vitest";
import {
  salaryNet,
  salariedPeople,
  buildSalaryRows,
  partnerPayoutMonthTotal,
  salaryCostBreakdownForMonth,
  salaryCostForMonth,
  visibleSalaryRows,
  salaryCostByMonth,
  resolveBaseSalary,
  workedDays,
  computeEarned,
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
      { personType: "office", personId: "o1", name: "An", role: "COO", baseSalary: 20_000_000, additions: 0, deductions: 0, advances: 0, workDays: 25, earned: 20_000_000, locked: false, note: "", paid: false, net: 20_000_000 },
      { personType: "driver", personId: "d1", name: "Ba", role: "Lái xe", baseSalary: 12_000_000, additions: 0, deductions: 0, advances: 0, workDays: 25, earned: 12_000_000, locked: false, note: "", paid: false, net: 12_000_000 },
    ];
    const payouts = [{ workDate: "2026-07-10", amount: 1_500_000 }];
    expect(salaryCostForMonth(rows, payouts, "2026-07")).toBe(33_500_000);
  });

  it("tách đúng lương nhân viên, lái xe tháng và lái xe ngày", () => {
    const rows: SalaryRow[] = [
      { personType: "office", personId: "o1", name: "An", role: "COO", baseSalary: 20_000_000, additions: 0, deductions: 0, advances: 0, workDays: 25, earned: 20_000_000, locked: false, note: "", paid: false, net: 20_000_000 },
      { personType: "driver", personId: "d1", name: "Ba", role: "Lái xe", baseSalary: 12_000_000, additions: 0, deductions: 0, advances: 0, workDays: 25, earned: 12_000_000, locked: false, note: "", paid: false, net: 12_000_000 },
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
    { personType: "office", personId: "o1", name: "An", role: "COO", baseSalary: 0, additions: 0, deductions: 0, advances: 0, workDays: 25, earned: 0, locked: false, note: "", paid: false, net: 0 },
    { personType: "driver", personId: "d1", name: "Ba", role: "Lái xe", baseSalary: 0, additions: 0, deductions: 0, advances: 0, workDays: 25, earned: 0, locked: false, note: "", paid: false, net: 0 },
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

describe("salaryCostByMonth", () => {
  it("tháng không có dòng SalaryMonth và không có phiếu công vẫn ra lương cơ bản của người đang làm", () => {
    const office = [{ id: "o1", name: "An", position: "Nhân viên", baseSalary: 10_000_000 }];
    const drivers = [{ id: "d1", name: "Ba", type: "own", baseSalary: 8_000_000 }];
    const breakdown = salaryCostByMonth(office, drivers, [], [], ["2026-07"]);

    expect(breakdown["2026-07"]).toEqual({
      office: 10_000_000,
      monthlyDrivers: 8_000_000,
      dailyDrivers: 0,
      total: 18_000_000,
    });
  });

  it("tháng có dòng lương: dùng snapshot + thưởng/khấu trừ", () => {
    const office = [{ id: "o1", name: "An", position: "Nhân viên", baseSalary: 10_000_000 }];
    const months = [
      {
        monthKey: "2026-07",
        personType: "office",
        personId: "o1",
        baseSalary: 10_000_000,
        additions: 1_000_000,
        deductions: 500_000,
        note: "",
        paid: false,
      },
    ];
    const breakdown = salaryCostByMonth(office, [], months, [], ["2026-07"]);
    expect(breakdown["2026-07"].office).toBe(10_500_000);
    expect(breakdown["2026-07"].total).toBe(10_500_000);
  });

  it("người có endDate giữa tháng 8: tính theo ngày công tháng 8 (15/25), vắng ở tháng 9", () => {
    const office = [
      { id: "o1", name: "An", position: "Nhân viên", baseSalary: 10_000_000, endDate: "2026-08-15" },
    ];
    const breakdown = salaryCostByMonth(office, [], [], [], ["2026-08", "2026-09"]);
    expect(breakdown["2026-08"].total).toBe(6_000_000);
    expect(breakdown["2026-09"].total).toBe(0);
  });

  it("phiếu công đối tác tính đúng tháng của workDate (dailyDrivers), không lẫn sang tháng khác", () => {
    const payouts = [
      { workDate: "2026-07-15", amount: 1_200_000 },
      { workDate: "2026-08-02", amount: 2_000_000 },
    ];
    const breakdown = salaryCostByMonth([], [], [], payouts, ["2026-07", "2026-08"]);
    expect(breakdown["2026-07"].dailyDrivers).toBe(1_200_000);
    expect(breakdown["2026-07"].total).toBe(1_200_000);
    expect(breakdown["2026-08"].dailyDrivers).toBe(2_000_000);
    expect(breakdown["2026-08"].total).toBe(2_000_000);
  });

  it("lái xe partner không bao giờ vào lương tháng", () => {
    const drivers = [{ id: "d2", name: "Tư", type: "partner", baseSalary: 15_000_000 }];
    const breakdown = salaryCostByMonth([], drivers, [], [], ["2026-07"]);
    expect(breakdown["2026-07"].monthlyDrivers).toBe(0);
    expect(breakdown["2026-07"].total).toBe(0);
  });

  it("mỗi khóa trong monthKeys đều có mặt trong kết quả, kể cả tháng không có gì (total = 0)", () => {
    const breakdown = salaryCostByMonth([], [], [], [], ["2026-05", "2026-06"]);
    expect(breakdown["2026-05"]).toEqual({
      office: 0,
      monthlyDrivers: 0,
      dailyDrivers: 0,
      total: 0,
    });
    expect(breakdown["2026-06"]).toEqual({
      office: 0,
      monthlyDrivers: 0,
      dailyDrivers: 0,
      total: 0,
    });
  });

  it("tạm ứng: không có advances thì kết quả y như cũ; 2 lần ứng trong tháng cộng dồn trừ vào net", () => {
    const people = [{ personType: "driver" as const, personId: "d1", name: "Ba", role: "Lái xe", baseSalary: 10_000_000 }];
    const [noAdv] = buildSalaryRows(people, []);
    expect(noAdv.advances).toBe(0);
    expect(noAdv.net).toBe(10_000_000);

    const [withAdv] = buildSalaryRows(people, [], [
      { personType: "driver", personId: "d1", amount: 1_500_000 },
      { personType: "driver", personId: "d1", amount: 2_000_000 },
    ]);
    expect(withAdv.advances).toBe(3_500_000);
    expect(withAdv.net).toBe(6_500_000);
  });

  it("tạm ứng tháng 10 không ảnh hưởng tháng 11 và ứng nhiều hơn lương → net âm", () => {
    const drivers = [{ id: "d1", name: "Ba", type: "own", baseSalary: 5_000_000 }];
    const advances = [
      { personType: "driver", personId: "d1", date: "2026-10-15", amount: 7_000_000 },
    ];
    const breakdown = salaryCostByMonth([], drivers, [], [], ["2026-10", "2026-11"], advances);
    expect(breakdown["2026-10"].monthlyDrivers).toBe(-2_000_000);
    expect(breakdown["2026-11"].monthlyDrivers).toBe(5_000_000);
  });

  it("salaryCostByMonth có advances giảm chi phí đúng tháng", () => {
    const office = [{ id: "o1", name: "An", position: "COO", baseSalary: 20_000_000 }];
    const drivers = [{ id: "d1", name: "Ba", type: "own", baseSalary: 10_000_000 }];
    const advances = [
      { personType: "office", personId: "o1", date: "2026-09-05", amount: 3_000_000 },
      { personType: "driver", personId: "d1", date: "2026-09-12", amount: 1_000_000 },
    ];
    const breakdown = salaryCostByMonth(office, drivers, [], [], ["2026-09", "2026-10"], advances);
    expect(breakdown["2026-09"]).toEqual({
      office: 17_000_000,
      monthlyDrivers: 9_000_000,
      dailyDrivers: 0,
      total: 26_000_000,
    });
    expect(breakdown["2026-10"]).toEqual({
      office: 20_000_000,
      monthlyDrivers: 10_000_000,
      dailyDrivers: 0,
      total: 30_000_000,
    });
  });

  it("resolveBaseSalary & salariedPeople theo ngày hiệu lực của mức lương", () => {
    const rates = [
      { personType: "office", personId: "o1", effectiveFrom: "1970-01-01", amount: 15_000_000 },
      { personType: "office", personId: "o1", effectiveFrom: "2026-12-01", amount: 18_000_000 },
      { personType: "driver", personId: "d1", effectiveFrom: "2026-11-15", amount: 12_000_000 },
    ];
    // (a) không rates → như cũ
    const office = [{ id: "o1", name: "An", position: "COO", baseSalary: 18_000_000 }];
    const drivers = [{ id: "d1", name: "Ba", type: "own", baseSalary: 12_000_000 }];
    expect(salariedPeople(office, drivers, "2026-11", []).map((p) => p.baseSalary)).toEqual([18_000_000, 12_000_000]);

    // (b) 1 rate gốc + 1 rate mới hiệu lực 01/12 → tháng 11 mức cũ, tháng 12 mức mới
    expect(resolveBaseSalary(rates, "office", "o1", "2026-11", 99)).toBe(15_000_000);
    expect(resolveBaseSalary(rates, "office", "o1", "2026-12", 99)).toBe(18_000_000);

    // (c) hiệu lực 15/11 → tháng 11 vẫn fallback (chưa hiệu lực đầu tháng), tháng 12 mức mới
    expect(resolveBaseSalary(rates, "driver", "d1", "2026-11", 10_000_000)).toBe(10_000_000);
    expect(resolveBaseSalary(rates, "driver", "d1", "2026-12", 10_000_000)).toBe(12_000_000);

    // (d) tháng trước mọi rate → fallback
    expect(resolveBaseSalary(rates, "driver", "d1", "2026-10", 10_000_000)).toBe(10_000_000);

    // (e) salaryCostByMonth dùng đúng mức theo từng tháng
    const breakdown = salaryCostByMonth(office, drivers, [], [], ["2026-11", "2026-12"], [], rates);
    expect(breakdown["2026-11"].office).toBe(15_000_000);
    expect(breakdown["2026-12"].office).toBe(18_000_000);
  });

  it("tính lương theo ngày vào/nghỉ làm (25 ngày công/tháng) và chia đoạn SalaryRate", () => {
    // (a) đủ tháng → earned = base
    expect(computeEarned({ monthKey: "2026-09", rates: [], fallbackBase: 10_000_000 })).toEqual({
      workDays: 30,
      credit: 25,
      earned: 10_000_000,
    });

    // (b) vào làm 10/09 (30 ngày) → 21 ngày → 84%
    expect(
      computeEarned({ monthKey: "2026-09", startDate: "2026-09-10", rates: [], fallbackBase: 10_000_000 })
    ).toEqual({ workDays: 21, credit: 21, earned: 8_400_000 });

    // (c) vào làm ngày 6 tháng 30 ngày → 25 ngày → 100%
    expect(
      computeEarned({ monthKey: "2026-09", startDate: "2026-09-06", rates: [], fallbackBase: 10_000_000 })
    ).toEqual({ workDays: 25, credit: 25, earned: 10_000_000 });

    // (d) nghỉ 15/08 → 15 ngày → 60%
    expect(
      computeEarned({ monthKey: "2026-08", endDate: "2026-08-15", rates: [], fallbackBase: 10_000_000 })
    ).toEqual({ workDays: 15, credit: 15, earned: 6_000_000 });

    // (e) vào VÀ nghỉ cùng tháng (10/09..19/09 = 10 ngày → 40%)
    expect(
      computeEarned({
        monthKey: "2026-09",
        startDate: "2026-09-10",
        endDate: "2026-09-19",
        rates: [],
        fallbackBase: 10_000_000,
      })
    ).toEqual({ workDays: 10, credit: 10, earned: 4_000_000 });

    // (f) tháng 2 (28 ngày) và tháng 2 nhuận (29 ngày) làm đủ → 100%
    expect(workedDays("2026-02")).toBe(28);
    expect(workedDays("2024-02")).toBe(29);
    expect(computeEarned({ monthKey: "2026-02", rates: [], fallbackBase: 10_000_000 }).earned).toBe(10_000_000);

    // (g) đổi mức giữa tháng: 10M đến 14/11, 12M từ 15/11, làm đủ tháng 11 (30 ngày)
    expect(
      computeEarned({
        monthKey: "2026-11",
        rates: [
          { effectiveFrom: "1970-01-01", amount: 10_000_000 },
          { effectiveFrom: "2026-11-15", amount: 12_000_000 },
        ],
        fallbackBase: 12_000_000,
      })
    ).toEqual({ workDays: 30, credit: 25, earned: 11_066_667 });

    // (h) người vào làm SAU tháng → không có dòng
    const office = [{ id: "o1", name: "An", position: "COO", baseSalary: 10_000_000, startDate: "2026-10-01" }];
    expect(salariedPeople(office, [], "2026-09")).toEqual([]);

    // (i) không có monthKey → như cũ (workDays = 25, earned = baseSalary)
    const [noMonthRow] = buildSalaryRows(salariedPeople(office, []), []);
    expect(noMonthRow.workDays).toBe(25);
    expect(noMonthRow.earned).toBe(10_000_000);

    // (j) tạm ứng / thưởng không tỷ lệ; (k) salaryCostByMonth cộng đúng
    const drivers = [{ id: "d1", name: "Ba", type: "own", baseSalary: 10_000_000, startDate: "2026-09-10" }];
    const months = [{ personType: "driver", personId: "d1", monthKey: "2026-09", baseSalary: 10_000_000, additions: 1_000_000, deductions: 200_000, note: "", paid: false }];
    const advances = [{ personType: "driver", personId: "d1", date: "2026-09-15", amount: 500_000 }];
    const breakdown = salaryCostByMonth([], drivers, months, [], ["2026-09"], advances);
    // earned = 8.400.000 + 1.000.000 - 200.000 - 500.000 = 8.700.000
    expect(breakdown["2026-09"].monthlyDrivers).toBe(8_700_000);
  });

  it("chốt phiếu lương (locked): giữ snapshot earned/workDays/advances dù dữ liệu gốc đổi", () => {
    const drivers = [
      { id: "d1", name: "Ba", type: "own", baseSalary: 20_000_000, endDate: "2026-08-10" },
    ];
    const months = [
      {
        personType: "driver",
        personId: "d1",
        monthKey: "2026-08",
        baseSalary: 10_000_000,
        additions: 500_000,
        deductions: 200_000,
        note: "",
        paid: true,
        locked: true,
        workDays: 25,
        earned: 10_000_000,
        advances: 1_000_000,
      },
    ];
    const rates = [{ personType: "driver", personId: "d1", effectiveFrom: "2026-08-01", amount: 20_000_000 }];
    const advances = [{ personType: "driver", personId: "d1", date: "2026-08-20", amount: 5_000_000 }];

    // (a) dòng locked dùng snapshot → net = 10M + 500k - 200k - 1M = 9.3M
    const people = salariedPeople([], drivers, "2026-08", rates);
    const [lockedRow] = buildSalaryRows(people, months, advances);
    expect(lockedRow.locked).toBe(true);
    expect(lockedRow.baseSalary).toBe(10_000_000);
    expect(lockedRow.workDays).toBe(25);
    expect(lockedRow.earned).toBe(10_000_000);
    expect(lockedRow.advances).toBe(1_000_000);
    expect(lockedRow.net).toBe(9_300_000);

    // (b) dòng chưa chốt vẫn tính động (10 ngày công từ 20M = 8M, trừ 5M tạm ứng)
    const [unlockedRow] = buildSalaryRows(people, [{ ...months[0], locked: false }], advances);
    expect(unlockedRow.locked).toBe(false);
    expect(unlockedRow.earned).toBe(8_000_000);
    expect(unlockedRow.net).toBe(3_300_000);

    // (c) salaryCostByMonth dùng số đã chốt
    const breakdown = salaryCostByMonth([], drivers, months, [], ["2026-08"], advances, rates);
    expect(breakdown["2026-08"].monthlyDrivers).toBe(9_300_000);
  });
});
