const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { fileSizeFormatter } = require("../utils/fileUpload"); // (We will create this utility next)
const cloudinary = require("cloudinary").v2;

// @desc    Create New Product (Strict Upsert)
// @route   POST /api/products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, brand, seller, quantity, price, description } = req.body;

  // 1. Validation
  if (!name || !category || !brand || !seller || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }

  // 2. Handle Image
  let fileData = {};
  if (req.file) {
    fileData = {
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // 3. STRICT CHECK: Does a product with these EXACT attributes exist?
  const existingProduct = await Product.findOne({
    user: req.user.id,
    name,
    category,
    brand,
    seller,
    price // Price must also match to be considered "the same"
  });

  if (existingProduct) {
    // --- MERGE (Upsert) ---
    // Just add the new quantity to the existing stock
    existingProduct.quantity = Number(existingProduct.quantity) + Number(quantity);
    
    // Optional: Update SKU/Description if provided, or keep old
    if (sku) existingProduct.sku = sku;
    if (description) existingProduct.description = description;
    if (Object.keys(fileData).length > 0) existingProduct.image = fileData;

    const updatedProduct = await existingProduct.save();
    res.status(200).json(updatedProduct);
  } else {
    // --- CREATE NEW ---
    const product = await Product.create({
      user: req.user.id,
      name, sku, category, brand, seller, quantity, price, description,
      image: fileData,
    });
    res.status(201).json(product);
  }
});

// @desc    Update Product (Merge on Edit)
// @route   PATCH /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, brand, seller, quantity, price, description, sku } = req.body;
  const { id } = req.params;

  const productToEdit = await Product.findById(id);

  if (!productToEdit) {
    res.status(404); throw new Error("Product not found");
  }
  if (productToEdit.user.toString() !== req.user.id) {
    res.status(401); throw new Error("User not authorized");
  }

  // 1. Check if the edits make this product identical to ANOTHER existing product
  // (Exclude the current product's ID from search)
  const duplicateProduct = await Product.findOne({
    user: req.user.id,
    _id: { $ne: id }, // Not this product
    name: name || productToEdit.name,
    category: category || productToEdit.category,
    brand: brand || productToEdit.brand,
    seller: seller || productToEdit.seller,
    price: price || productToEdit.price
  });

  if (duplicateProduct) {
    // --- MERGE SCENARIO ---
    // The user edited "Product A" to look exactly like "Product B".
    // Action: Delete "Product A", Add its quantity to "Product B".

    const newQty = Number(duplicateProduct.quantity) + Number(quantity || productToEdit.quantity);
    duplicateProduct.quantity = newQty;
    
    // Update other fields on the target if desired
    if (description) duplicateProduct.description = description;
    if (req.file) {
      duplicateProduct.image = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: fileSizeFormatter(req.file.size, 2),
      };
    }

    await duplicateProduct.save();
    await Product.findByIdAndDelete(id); // Goodbye Product A
    
    res.status(200).json(duplicateProduct);

  } else {
    // --- STANDARD UPDATE ---
    // No match found, just update this product normally
    let fileData = {};
    if (req.file) {
      fileData = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: fileSizeFormatter(req.file.size, 2),
      };
    }

    productToEdit.name = name || productToEdit.name;
    productToEdit.category = category || productToEdit.category;
    productToEdit.brand = brand || productToEdit.brand;
    productToEdit.seller = seller || productToEdit.seller;
    productToEdit.quantity = quantity || productToEdit.quantity;
    productToEdit.price = price || productToEdit.price;
    productToEdit.description = description || productToEdit.description;
    productToEdit.sku = sku || productToEdit.sku;
    if (Object.keys(fileData).length > 0) {
      productToEdit.image = fileData;
    }

    const updatedProduct = await productToEdit.save();
    res.status(200).json(updatedProduct);
  }
});
// @desc    Get all Products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  // Only fetch products belonging to the logged-in user
  const products = await Product.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(products);
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  // Check if product exists
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  res.status(200).json(product);
});

// @desc    Delete Product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  // Use deleteOne() instead of remove() in Mongoose 9
  await product.deleteOne();
  res.status(200).json({ message: "Product deleted." });
});


module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};