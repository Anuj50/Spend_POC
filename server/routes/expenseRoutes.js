const express = require("express");
const Expense = require("../models/Expense");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

router.get("/summary", async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id });
    const total = expenses.reduce((sum, x) => sum + x.amount, 0);
    const gst = expenses.reduce((sum, x) => sum + x.gst, 0);

    const byCategory = {};
    expenses.forEach((x) => {
      byCategory[x.category] = (byCategory[x.category] || 0) + x.amount;
    });

    res.json({ total, gst, count: expenses.length, byCategory });
  } catch {
    res.status(500).json({ message: "Could not create summary." });
  }
});

router.get("/", async (req, res) => {
  const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
  res.json(expenses);
});

router.post("/", async (req, res) => {
  try {
    const { merchantName, category, amount, gstRate = 0, paymentMethod = "Other", date, scanned } = req.body;

    const numericAmount = Number(amount);
    const rate = Number(gstRate);
    const gst = numericAmount * rate / 100;

    const expense = await Expense.create({
      user: req.user.id,
      merchantName,
      category,
      amount: numericAmount,
      gstRate: rate,
      gst,
      cgst: gst / 2,
      sgst: gst / 2,
      paymentMethod,
      date: date || new Date()
    });

    if (scanned) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { billsScanned: 1 } });
    }

    res.status(201).json(expense);
  } catch {
    res.status(400).json({ message: "Could not add expense." });
  }
});

router.delete("/:id", async (req, res) => {
  const deleted = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Expense not found." });
  res.json({ message: "Expense deleted." });
});

module.exports = router;
