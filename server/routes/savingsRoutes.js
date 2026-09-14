const express = require("express");
const Saving = require("../models/Saving");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

router.get("/", async (req, res) => {
  let savings = await Saving.find({ user: req.user.id }).sort({ createdAt: -1 });

  if (!savings.length) {
    savings = await Saving.insertMany([
      { user: req.user.id, title: "Mobile recharge", description: "5% off mobile recharge", discount: "5% OFF", amount: 0, unlocked: true },
      { user: req.user.id, title: "Internet bill", description: "Save ₹250 on your next internet bill", discount: "₹250 OFF", amount: 250, unlocked: true },
      { user: req.user.id, title: "Electric bill", description: "20% off electric bill", discount: "20% OFF", amount: 0, unlocked: false }
    ]);
  }

  res.json(savings);
});

module.exports = router;
