const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const userRoute = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const productRoute = require("./routes/productRoutes");
const saleRoute = require("./routes/saleRoutes");
const dashboardRoute = require("./routes/dashboardRoutes");
const app = express();
const path = require("path");

connectDB();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "https://inventorysystemmanagenment.vercel.app"], // Allow Frontend
  credentials: true // Essential for cookies
}));

// Routes (We will add these later)
app.get("/", (req, res) => {
  res.send("Inventory Management System API");
});


// Routes Middleware
app.use("/api/users", userRoute);
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);

// ... app.use products
app.use("/api/sales", saleRoute);
app.use("/api/dashboard", dashboardRoute);

app.use("/api/options", require("./routes/optionsRoute"));
// Error Middleware (Must be the last app.use)
app.use(errorHandler);
// Make 'uploads' folder static so frontend can access images directly if needed
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Error Handling Middleware (Placeholder)
app.use((err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : null,
  });
});
app.get("/", (req, res) => {
  res.send("KodeKrate Backend is Running");
});

const PORT = process.env.PORT || 5000;

// Only listen locally. In Vercel, it acts as a serverless function.
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; // Export app for testing and serverless deployment