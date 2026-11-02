const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

// @desc    Get Dashboard Statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  // Fetch all products belonging to this user
  const products = await Product.find({ user: req.user.id });

  // 1. Calculate Total Store Value
  const totalStoreValue = products.reduce((acc, item) => {
    return acc + (Number(item.price) * Number(item.quantity));
  }, 0);

  // 2. Calculate Out of Stock Items
  const outOfStock = products.filter((item) => Number(item.quantity) === 0).length;

  // 3. Calculate Total Products
  const totalProducts = products.length;

  // 4. Calculate Unique Categories
  const allCategories = products.map((item) => item.category);
  // Set removes duplicates, then we get the size
  const categoryCount = [...new Set(allCategories)].length;

  res.status(200).json({
    totalProducts,
    totalStoreValue,
    outOfStock,
    categoryCount,
  });
});

module.exports = { getDashboardStats };