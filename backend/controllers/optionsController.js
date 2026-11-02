const asyncHandler = require("express-async-handler");
const Category = require("../models/Category.js");
const Brand = require("../models/brandModel.js");
const Seller = require("../models/sellerModel.js");
const slugify = require("slugify");

// --- CATEGORY ---
const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new Error("Please add a category name");
  const category = await Category.create({ 
      name, 
      slug: slugify(name), 
      user: req.user.id 
  });
  res.status(201).json(category);
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(categories);
});

// --- BRAND ---
const createBrand = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new Error("Please add a brand name");
  const brand = await Brand.create({ 
      name, 
      slug: slugify(name), 
      user: req.user.id 
  });
  res.status(201).json(brand);
});

const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(brands);
});

// --- SELLER ---
const createSeller = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) throw new Error("Please fill all seller fields");
  const seller = await Seller.create({ 
      name, email, phone, user: req.user.id 
  });
  res.status(201).json(seller);
});

const getSellers = asyncHandler(async (req, res) => {
  const sellers = await Seller.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(sellers);
});

module.exports = {
  createCategory, getCategories,
  createBrand, getBrands,
  createSeller, getSellers
};