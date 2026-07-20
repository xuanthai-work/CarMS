const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/db.json');
const seedPath = path.join(__dirname, '../data/seed.json');

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Only grab bookings with vehicle and driver assigned
const validBookings = seed.bookings.filter(b => b.vehicleId && b.driverId);

const trips = validBookings.map((b, i) => {
    let tourType = "1d";
    if (b.days === 2) tourType = "2n1d";
    if (b.days === 3) tourType = "3n2d";
    if (b.days === 4) tourType = "4n3d";
    if (b.leg === "outbound" || b.leg === "return") tourType = "oneway";

    let hasReturn = b.leg === "round" && b.endDate !== b.date;

    const outFrom = b.route.includes("HN") || b.route.includes("Hà Nội") ? "Hà Nội" : b.route.split("-")[0] || b.route;
    const outTo = b.route.split("-")[1] || b.route;

    return {
        id: `t-${b.id}`,
        customerName: b.customerName || "Khách",
        customerPhone: b.phone,
        tourType,
        price: b.price,
        deposit: b.deposit,
        status: b.date < "2026-07-20" ? "completed_paid" : "info_sent",
        heldThroughTour: hasReturn,
        note: b.rawText,
        outbound: {
            date: b.date,
            time: b.time,
            from: outFrom.trim(),
            to: outTo.trim(),
            vehicleId: b.vehicleId,
            driverId: b.driverId
        },
        return: hasReturn ? {
            date: b.endDate,
            time: "13:30", // giờ mặc định
            from: outTo.trim(),
            to: outFrom.trim(),
            vehicleId: b.vehicleId,
            driverId: b.driverId
        } : null
    };
});

db.trips = trips;
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Migrated ${trips.length} trips into db.json!`);
