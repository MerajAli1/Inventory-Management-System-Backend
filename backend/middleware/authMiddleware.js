const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next) => {
  try {
    // 1. Check if token exists in cookies
    const token = req.cookies.token;

    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    // 2. Verify Token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Get User from DB (exclude password)
    // We attach the user to the request object so the Controller can use it
    const user = await User.findById(verified.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    req.user = user;
    next(); // Proceed to the Controller

  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});

module.exports = protect;