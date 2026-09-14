const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  provider: { type: String, default: "" },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  recurring: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Bill", billSchema);
