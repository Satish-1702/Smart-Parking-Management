import mongoose from "mongoose";

const DrivingLicenseSchema = new mongoose.Schema(
  {
    license_no: { type: String, required: true },
    license_image: String,
    verified: { type: Boolean, default: false },
  },
  { _id: false }
);

const VehicleSchema = new mongoose.Schema(
  {
    vehicle_number: { type: String, required: true },
    vehicle_type: String,
    vehicle_model: String,
    rc_number: String,
    rc_image: String,
  },
  { _id: true }
);

const UserSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    password_hash: { type: String, required: true },
    driving_license: DrivingLicenseSchema,
    vehicles: [VehicleSchema],
  },
  { timestamps: true }
);

export const UserModel = mongoose.model("User", UserSchema);
