const express = require("express");
const Saving = require("../models/Saving");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

router.get("/", async (req, res) => {
  let savings = await Saving.find({ user: req.user.id }).sort({ createdAt: -1 });

  if (!savings.length) {
    savings = await Saving.insertMany([
      { user: req.user.id, title: "Mobile recharge", description: "5% off mobile recharge", discount: "5% OFF", amount: 50, category: "Utilities", unlocked: true },
      { user: req.user.id, title: "Internet bill", description: "Save ₹250 on your next internet bill", discount: "₹250 OFF", amount: 250, category: "Utilities", unlocked: true },
      { user: req.user.id, title: "Electric bill", description: "20% off electric bill", discount: "20% OFF", amount: 180, category: "Utilities", unlocked: true },
      { user: req.user.id, title: "Grocery cashback", description: "Save on your weekly grocery run", discount: "10% OFF", amount: 120, category: "Groceries", unlocked: true },
      { user: req.user.id, title: "Dining discount", description: "10% off at partner restaurants", discount: "10% OFF", amount: 90, category: "Dining", unlocked: true }
    ]);
  }

  res.json(savings);
});

router.patch("/:id/redeem", async (req, res) => {
  const saving = await Saving.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id, redeemed: false },
    { redeemed: true, redeemedAt: new Date() },
    { new: true }
  );
  if (!saving) return res.status(404).json({ message: "Offer not found or already redeemed." });
  res.json(saving);
});

module.exports = router;
