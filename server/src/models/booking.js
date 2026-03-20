import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    place_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingPlace",
      required: true,
    },
    slot_id: { type: String, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    total_amount: { type: Number, required: true },
    booking_status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

BookingSchema.index({ user_id: 1 });
BookingSchema.index({ place_id: 1 });
BookingSchema.index({ booking_status: 1 });

export const BookingModel = mongoose.model("Booking", BookingSchema);
