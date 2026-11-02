const mongoose = require("mongoose");

const sellerSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  name: {
    type: String,
    required: [true, "Please add a seller name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please add a seller email"],
    trim: true,
    unique: true,
  },
  phone: {
    type: String,
    required: [true, "Please add a phone number"],
  },
}, { timestamps: true });

module.exports = mongoose.model("Seller", sellerSchema);