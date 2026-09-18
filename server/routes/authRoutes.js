const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { sendResetPasswordEmail } = require("../utils/email");

const router = express.Router();

function toProfile(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    monthlyIncome: user.monthlyIncome,
    phone: user.phone,
    businessName: user.businessName,
    gstin: user.gstin,
    billsScanned: user.billsScanned,
    plan: user.plan
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email is already registered." });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash });

    res.status(201).json({
      token: signToken(user),
      user: toProfile(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password." });

    res.json({
      token: signToken(user),
      user: toProfile(user)
    });
  } catch {
    res.status(500).json({ message: "Login failed." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const genericMessage = { message: "If that email is registered, a reset link has been sent." };

    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json(genericMessage);

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendResetPasswordEmail(user.email, resetUrl);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError.message);
    }

    res.json(genericMessage);
  } catch {
    res.status(500).json({ message: "Could not process password reset." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res.status(400).json({ message: "Email, token and new password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) return res.status(400).json({ message: "This reset link is invalid or has expired." });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now sign in." });
  } catch {
    res.status(500).json({ message: "Could not reset password." });
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json(toProfile(user));
});

router.patch("/me", auth, async (req, res) => {
  try {
    const { monthlyIncome, phone, businessName, gstin } = req.body;
    const update = {};

    if (monthlyIncome !== undefined) {
      const numeric = Number(monthlyIncome);
      if (Number.isNaN(numeric) || numeric < 0) {
        return res.status(400).json({ message: "Monthly income must be a positive number." });
      }
      update.monthlyIncome = numeric;
    }
    if (phone !== undefined) update.phone = String(phone).trim();
    if (businessName !== undefined) update.businessName = String(businessName).trim();
    if (gstin !== undefined) update.gstin = String(gstin).trim();

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    res.json(toProfile(user));
  } catch {
    res.status(400).json({ message: "Could not update profile." });
  }
});

module.exports = router;
