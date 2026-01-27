import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    row: Number,
    col: Number,
    zone: String,
    status: Number, // 0 vacant, 1 occupied, 2 unavailable
    type: String,
    price: Number,
    updatedAt: Date,
  },
  { timestamps: true }
);

export const SlotModel = mongoose.model("Slot", SlotSchema);

