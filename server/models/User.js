const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  monthlyIncome: { type: Number, default: 0, min: 0 },
  phone: { type: String, default: "", trim: true },
  businessName: { type: String, default: "", trim: true },
  gstin: { type: String, default: "", trim: true },
  billsScanned: { type: Number, default: 0, min: 0 },
  plan: { type: String, enum: ["free", "premium"], default: "free" },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
