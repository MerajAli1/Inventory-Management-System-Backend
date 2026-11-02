const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  name: {
    type: String,
    required: [true, "Please add a category name"],
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);