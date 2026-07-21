export type Vehicle = {
  id: string;
  plate: string;
  seats: number | null;
  status: string; // active | maintenance | inactive
  type: string; // own | partner (của công ty | cộng tác ngoài)
  inspectionDue: string | null; // YYYY-MM-DD - hạn đăng kiểm
  insuranceDue: string | null; // YYYY-MM-DD - hạn bảo hiểm
  note: string;
};

export type Driver = {
  id: string;
  name: string;
  phone: string | null; // SĐT = Zalo (dùng chung một số)
  licenseClass: string; // hạng bằng: B2, C, D, E, F
  type: string; // own | partner
  note: string;
};

/** Loại tour (enum) — xem nhãn & số ngày trong lib/trips.ts */
export type TourType = "1d" | "2n1d" | "3n2d" | "4n3d" | "oneway";

/** Một lượt (đi hoặc về): xe + lái xe + lộ trình + thời điểm đón. */
export type Leg = {
  date: string; // YYYY-MM-DD
  time: string | null; // HH:mm - thời gian đón
  endTime: string | null; // HH:mm - giờ đến (dự kiến) → suy ra thời lượng trên lịch theo xe
  from: string; // điểm đón
  to: string; // điểm đến
  vehicleId: string | null; // ⇒ suy ra loại xe + biển số (null = chưa gán / giao đối tác)
  driverId: string | null; // ⇒ suy ra tên + sđt lái xe (null = chưa gán)
};

/**
 * Chuyến của khách. Đơn vị hiển thị trên lịch là "lượt" (outbound/return),
 * vì một chuyến có thể do 1 xe chạy trọn, hoặc xe A đi / xe B về.
 */
export type Trip = {
  id: string;
  customerName: string; // tên Zalo khách
  customerPhone: string | null; // sđt khách
  tourType: TourType;
  price: number | null; // tiền chuyến
  deposit: number | null; // đặt cọc (null nếu không)
  status?: "pending" | "info_sent" | "completed_paid";
  heldThroughTour: boolean; // giữ xe suốt tour (chỉ có nghĩa khi cùng 1 xe cả đi & về)
  note: string;
  outbound: Leg; // lượt đi (bắt buộc)
  return: Leg | null; // lượt về (null nếu một chiều)
};

/**
 * Store JSON. App dùng `vehicles` + `drivers` + `trips`.
 * seed.json còn giữ customers/partners/bookings (import thô từ Excel, chưa nối UI)
 * — không khai báo type ở đây nhưng vẫn được bảo toàn khi ghi lại.
 */
export type DB = {
  meta?: Record<string, unknown>;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
};
