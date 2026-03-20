import mongoose from "mongoose";

const PlaceNameSchema = new mongoose.Schema(
  {
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 2,
        message: "coordinates must be [longitude, latitude]",
      },
    },
  },
  { _id: false }
);

const PricingSchema = new mongoose.Schema(
  {
    normal_price: { type: Number, default: 0 },
    vip_price: { type: Number, default: 0 },
  },
  { _id: false }
);

const SlotSchema = new mongoose.Schema(
  {
    slot_id: { type: String, required: true },
    slot_number: { type: String, required: true },
    slot_type: { type: String, default: "standard" },
    features: [String],
    status: { type: Number, default: 0 },
    row: Number,
    col: Number,
    zone: String,
    price: Number,
  },
  { _id: false }
);

const ParkingPlaceSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    place_name: PlaceNameSchema,
    location: LocationSchema,
    pricing: PricingSchema,
    features: [String],
    slots: [SlotSchema],
  },
  { timestamps: true }
);

ParkingPlaceSchema.index({ admin_id: 1 });
ParkingPlaceSchema.index({ location: "2dsphere" });

export const ParkingPlaceModel = mongoose.model("ParkingPlace", ParkingPlaceSchema);
