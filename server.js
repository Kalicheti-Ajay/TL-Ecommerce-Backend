require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(express.json());
app.get("/", (req, res) => res.json({ message: "E-Commerce API is running." }));
app.use("/api/products", productRoutes);
app.use("/api/auth", userRoutes);

app.use((err, req, res, next) => {
  if (err.name === "MulterError") return res.status(400).json({ message: err.message });
  if (err.message === "Only CSV files are allowed.") return res.status(400).json({ message: err.message });
  if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
  if (err.code === 11000) return res.status(409).json({ message: "A record with this value already exists." });
  console.error(err);
  return res.status(500).json({ message: "Internal server error." });
});

const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(port, () => console.log(`Server running at http://localhost:${port}`)))
  .catch((error) => { console.error("MongoDB connection error:", error.message); process.exit(1); });
