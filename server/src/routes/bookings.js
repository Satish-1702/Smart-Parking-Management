import { Router } from "express";
import { BookingModel, ParkingPlaceModel, UserModel } from "../models/index.js";

const router = Router();

router.post("/bookings", async (req, res) => {
  try {
    const { user_id, vehicle_id, place_id, slot_id, start_time, end_time } = req.body;

    if (!place_id || !slot_id || !start_time || !end_time) {
      return res.status(400).json({ error: "place_id, slot_id, start_time, end_time are required" });
    }

    const place = await ParkingPlaceModel.findById(place_id);
    if (!place) return res.status(404).json({ error: "place not found" });

    const slot = place.slots.find((s) => s.slot_id === slot_id);
    if (!slot) return res.status(404).json({ error: "slot not found" });
    if (slot.status === 1) return res.status(400).json({ error: "slot is already occupied" });

    let userId = user_id;
    if (!userId) {
      let demoUser = await UserModel.findOne({ email: "user@example.com" });
      if (!demoUser) {
        demoUser = await UserModel.create({
          full_name: "Demo User",
          email: "user@example.com",
          phone: "+91 9123456789",
          password_hash: "placeholder",
          vehicles: [{ vehicle_number: "AP09AB1234", vehicle_type: "car" }],
        });
      }
      userId = demoUser._id;
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ error: "invalid start_time or end_time" });
    }

    const hours = (end - start) / (1000 * 60 * 60);
    const pricePerHour = slot.price ?? place.pricing?.normal_price ?? 20;
    const total_amount = Math.ceil(hours * pricePerHour);

    const booking = await BookingModel.create({
      user_id: userId,
      vehicle_id: vehicle_id || null,
      place_id,
      slot_id,
      start_time: start,
      end_time: end,
      total_amount,
      booking_status: "confirmed",
      admin_id: place.admin_id,
    });

    slot.status = 1;
    place.markModified("slots");
    await place.save();

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/bookings", async (req, res) => {
  try {
    const { user_id } = req.query;
    const filter = {};
    if (user_id) filter.user_id = user_id;

    const bookings = await BookingModel.find(filter)
      .populate("place_id", "place_name location pricing")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/bookings/:id", async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id)
      .populate("place_id", "place_name location pricing")
      .lean();
    if (!booking) return res.status(404).json({ error: "booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
