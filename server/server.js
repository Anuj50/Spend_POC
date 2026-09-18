require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const billRoutes = require("./routes/billRoutes");
const savingsRoutes = require("./routes/savingsRoutes");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000"
}));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "Spend It Wisely API" });
});

// Reuse the connection across invocations on serverless platforms (Vercel)
// instead of reconnecting to MongoDB on every request.
let cached = global._mongooseConn;
if (!cached) cached = global._mongooseConn = { promise: null };

function connectDB() {
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI);
  }
  return cached.promise;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(500).json({ message: "Database connection failed." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/savings", savingsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB()
    .then(() => {
      console.log("MongoDB connected");
      app.listen(PORT, () => {
        console.log(`API running at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
}

module.exports = app;
