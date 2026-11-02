const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");

// Use the NEW Cloudinary upload utility
const { upload } = require("../utils/fileUpload");

// Routes
router.post("/", protect, upload.single("image"), createProduct);       // Create
router.patch("/:id", protect, upload.single("image"), updateProduct);   // Update
router.get("/", protect, getProducts);                                  // Get All
router.get("/:id", protect, getProduct);                                // Get Single
router.delete("/:id", protect, deleteProduct);                          // Delete

module.exports = router;