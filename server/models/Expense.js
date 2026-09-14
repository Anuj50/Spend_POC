const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  merchantName: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, default: 0, min: 0 },
  gst: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  paymentMethod: { type: String, default: "Other" },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);
