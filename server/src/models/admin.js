import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    password_hash: { type: String, required: true },
    government_id: String,
    id_proof_image: String,
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AdminModel = mongoose.model("Admin", AdminSchema);
