const mongoose = require("mongoose");

const savingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  amount: { type: Number, default: 0 },
  discount: { type: String, default: "" },
  unlocked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Saving", savingSchema);
