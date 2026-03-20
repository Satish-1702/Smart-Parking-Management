import { connectDb } from "./db.js";
import { UserModel, AdminModel, ParkingPlaceModel, SlotModel } from "./models/index.js";

async function seed() {
  await connectDb();

  const admin = await AdminModel.findOne({ email: "admin@parking.com" });
  let adminId = admin?._id;

  if (!adminId) {
    const newAdmin = await AdminModel.create({
      full_name: "Parking Admin",
      email: "admin@parking.com",
      phone: "+91 9876543210",
      password_hash: "placeholder",
      government_id: "GOV-001",
      verified: true,
    });
    adminId = newAdmin._id;
    console.log("Created admin:", newAdmin.email);
  }

  const placeCount = await ParkingPlaceModel.countDocuments({ admin_id: adminId });
  if (placeCount === 0) {
    const slots = [];
    let idx = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 10; c++) {
        const slotId = `S-${r}-${c}`;
        const zone = r % 2 === 0 ? "A" : "B";
        const type = Math.random() < 0.15 ? "ev" : Math.random() < 0.25 ? "accessible" : "standard";
        const slotFeatures = type === "ev" ? ["ev_charging"] : type === "accessible" ? ["accessible"] : [];
        slots.push({
          slot_id: slotId,
          slot_number: String(++idx),
          slot_type: type,
          features: slotFeatures,
          status: 0,
          row: r,
          col: c,
          zone,
          price: 2.5,
        });
      }
    }

    const baseSlots = slots;
    const makeSlots = (prefix) =>
      baseSlots.map((s, i) => ({ ...s, slot_id: `${prefix}-${i}`, slot_number: String(i + 1) }));

    await ParkingPlaceModel.create([
      {
        admin_id: adminId,
        place_name: { address: "123 Smart Street", city: "Central City", state: "State", pincode: "500001" },
        location: { type: "Point", coordinates: [78.4867, 17.385] },
        pricing: { normal_price: 20, vip_price: 50 },
        features: ["ev_charging", "accessibility", "covered", "security", "24_7"],
        slots,
      },
      {
        admin_id: adminId,
        place_name: { address: "456 Mall Road", city: "Central City", state: "State", pincode: "500002" },
        location: { type: "Point", coordinates: [78.495, 17.39] },
        pricing: { normal_price: 30, vip_price: 60 },
        features: ["ev_charging", "covered", "valet"],
        slots: makeSlots("M"),
      },
      {
        admin_id: adminId,
        place_name: { address: "789 Tech Park", city: "Central City", state: "State", pincode: "500003" },
        location: { type: "Point", coordinates: [78.47, 17.38] },
        pricing: { normal_price: 25, vip_price: 55 },
        features: ["ev_charging", "covered", "security"],
        slots: makeSlots("T"),
      },
      {
        admin_id: adminId,
        place_name: { address: "321 Station Plaza", city: "Central City", state: "State", pincode: "500004" },
        location: { type: "Point", coordinates: [78.51, 17.395] },
        pricing: { normal_price: 35, vip_price: 70 },
        features: ["ev_charging", "accessibility", "24_7"],
        slots: makeSlots("S"),
      },
      {
        admin_id: adminId,
        place_name: { address: "555 Hospital Lane", city: "Central City", state: "State", pincode: "500005" },
        location: { type: "Point", coordinates: [78.48, 17.37] },
        pricing: { normal_price: 15, vip_price: 40 },
        features: ["accessibility", "security", "24_7"],
        slots: makeSlots("H"),
      },
    ]);
    console.log("Created 5 parking places with features");
  }

  const user = await UserModel.findOne({ email: "user@example.com" });
  if (!user) {
    await UserModel.create({
      full_name: "Demo User",
      email: "user@example.com",
      phone: "+91 9123456789",
      password_hash: "placeholder",
      driving_license: {
        license_no: "DL-12345",
        verified: false,
      },
      vehicles: [
        {
          vehicle_number: "AP09AB1234",
          vehicle_type: "car",
          vehicle_model: "Sedan",
          rc_number: "RC-001",
        },
      ],
    });
    console.log("Created demo user");
  }

  const slotCount = await SlotModel.countDocuments();
  if (slotCount === 0) {
    const docs = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 10; c++) {
        const slotId = `S-${r}-${c}`;
        const zone = r % 2 === 0 ? "A" : "B";
        const type = Math.random() < 0.15 ? "ev" : Math.random() < 0.25 ? "accessible" : "standard";
        docs.push({
          id: slotId,
          row: r,
          col: c,
          zone,
          status: 0,
          type,
          price: 2.5,
        });
      }
    }
    await SlotModel.insertMany(docs);
    console.log("Seeded", docs.length, "slots");
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
