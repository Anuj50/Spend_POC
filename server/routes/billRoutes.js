const express = require("express");
const Bill = require("../models/Bill");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

router.get("/", async (req, res) => {
  const bills = await Bill.find({ user: req.user.id }).sort({ dueDate: 1 });
  res.json(bills);
});

router.post("/", async (req, res) => {
  try {
    const bill = await Bill.create({ ...req.body, user: req.user.id });
    res.status(201).json(bill);
  } catch {
    res.status(400).json({ message: "Could not add bill." });
  }
});

router.patch("/:id/pay", async (req, res) => {
  const bill = await Bill.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { status: "Paid" },
    { new: true }
  );
  if (!bill) return res.status(404).json({ message: "Bill not found." });
  res.json(bill);
});

module.exports = router;
