const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createCategory, getCategories,
  createBrand, getBrands,
  createSeller, getSellers
} = require("../controllers/optionsController");

router.post("/category", protect, createCategory);
router.get("/category", protect, getCategories);

router.post("/brand", protect, createBrand);
router.get("/brand", protect, getBrands);

router.post("/seller", protect, createSeller);
router.get("/seller", protect, getSellers);

module.exports = router;