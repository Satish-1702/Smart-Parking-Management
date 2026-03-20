import { Router } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/index.js";

const router = Router();

router.post("/users/signup", async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "full_name, email and password are required" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      full_name,
      email,
      phone: phone || "",
      password_hash,
    });

    const user = {
      id: newUser._id,
      full_name: newUser.full_name,
      email: newUser.email,
    };

    return res.status(201).json({ user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select("full_name email phone vehicles driving_license");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
