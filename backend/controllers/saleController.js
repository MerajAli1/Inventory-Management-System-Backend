const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Sale = require("../models/Sale");

// @desc    Create New Sale (Handles Multiple Items)
// @route   POST /api/sales
// @access  Private
const createSale = asyncHandler(async (req, res) => {
  const { cartItems, buyerName, saleDate, grandTotal } = req.body;

  if (!cartItems || cartItems.length === 0) {
    res.status(400); throw new Error("No items in cart");
  }

  // 1. Deduct Stock for EACH item
  for (const item of cartItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.quantity = product.quantity - item.quantity;
      await product.save();
    }
  }

  // 2. Create ONE Sale Record for the whole transaction
  const sale = await Sale.create({
    user: req.user.id,
    buyerName,
    saleDate,
    grandTotal,
    cartItems // Save the array of items
  });

  res.status(201).json(sale);
});

// @desc    Get Sales History
// @route   GET /api/sales
// @access  Private
const getSales = asyncHandler(async (req, res) => {
  // Sort by Newest First
  const sales = await Sale.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(sales);
});

module.exports = { createSale, getSales };