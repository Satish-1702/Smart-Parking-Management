import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    amount: { type: Number, required: true },
    payment_method: {
      type: String,
      enum: ["UPI", "NETBANKING", "CARD", "CASH"],
    },
    transaction_id: String,
    paid_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PaymentSchema.index({ booking_id: 1 });

export const PaymentModel = mongoose.model("Payment", PaymentSchema);
