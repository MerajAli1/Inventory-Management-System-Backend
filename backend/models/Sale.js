const mongoose = require("mongoose");

const saleSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  buyerName: { type: String, required: true },
  saleDate: { type: Date, default: Date.now },
  grandTotal: { type: Number, required: true },
  cartItems: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // Link to product
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      amount: { type: Number, required: true }
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("Sale", saleSchema);