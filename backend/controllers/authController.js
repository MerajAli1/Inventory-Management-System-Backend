const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

// @desc    Register User
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  // Check if user email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("Email has already been registered");
  }

  // Create new user (BUT do not send token/cookie yet)
  const user = await User.create({
    name,
    email,
    password,
  });

  // Generate Verification Token (Same logic as Forgot Password)
  const verificationToken = crypto.randomBytes(32).toString("hex");
  
  // Hash token and save to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
    
  // Re-using resetPasswordToken field to store verification token temporarily
  // (Or you can create a specific field for it, but this works fine)
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();

  // Construct Verification URL
  const verificationUrl = `http://localhost:3000/verify/${verificationToken}`;

  // Send Email
  const message = `
    <h2>Hello ${user.name}</h2>
    <p>Thanks for registering on our Inventory App.</p>
    <p>Please click the link below to verify your account:</p>
    <a href=${verificationUrl} clicktracking=off>${verificationUrl}</a>
  `;

  try {
    await sendEmail(
      "Verify Your Account",
      message,
      user.email,
      "noreply@inventoryapp.com",
      "noreply@inventoryapp.com"
    );
    
    res.status(201).json({
      success: true,
      message: `Verification email sent to ${user.email}`,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Email could not be sent, please try again");
  }
});
// @desc    Verify User
// @route   PATCH /api/users/verify/:verificationToken
// @access  Public
const verifyUser = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or Expired Token");
  }

  // Verify User
  user.isVerified = true;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ message: "Account Verified" });
});
// @desc    Login User
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate Request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  
  // NEW CHECK: Is user verified?
  if (!user.isVerified) {
    res.status(400);
    throw new Error("Please verify your email before logging in");
  }

  // Check password
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  // Generate Token
  const token = generateToken(user._id);

  if (user && passwordIsCorrect) {
    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: true,
    });

    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

// @desc    Logout User
// @route   GET /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  // Expire the cookie immediately
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0), 
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

// @desc    Get User Data
// @route   GET /api/users/getuser
// @access  Private (Needs Auth Middleware)
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id, name, email, photo, phone, bio,
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

// @desc    Get Login Status
// @route   GET /api/users/loggedin
// @access  Public
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});


// @desc    Update User Profile
// @route   PATCH /api/users/updateuser
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, phone, bio, photo } = req.body;
    // Update fields if they exist in the request, otherwise keep old value
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.bio = bio || user.bio;
    user.photo = photo || user.photo;

    const updatedUser = await user.save();
    
    // Return sanitized data
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Change Password
// @route   PATCH /api/users/changepassword
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // 1. Validate Old Password
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!passwordIsCorrect) {
    res.status(400);
    throw new Error("Old password is incorrect");
  }

  // 2. Validate New Password
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  // 3. Hash and Save (The pre-save hook in User model handles hashing!)
  user.password = password;
  await user.save();

  res.status(200).json({ message: "Password changed successfully" });
});

// @desc    Forgot Password
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Generate Token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save token to DB (valid for 30 mins)
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  await user.save();

  // Construct Reset URL
  // NOTE: This points to your FRONTEND URL (port 3000)
  const resetUrl = `http://localhost:3000/resetpassword/${resetToken}`;

  // Email Message
  const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use the url below to reset your password</p>  
    <p>This reset link is valid for only 30 minutes.</p>

    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

    <p>Regards...</p>
    <p>Inventory Team</p>
  `;

  try {
    await sendEmail(
      "Password Reset Request",
      message,
      user.email,
      "noreply@inventoryapp.com",
      "noreply@inventoryapp.com"
    );
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    // If email fails, clear the token field
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500);
    throw new Error("Email could not be sent");
  }
});

// @desc    Reset Password
// @route   PUT /api/users/resetpassword/:resetToken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  const { resetToken } = req.params;

  // Compare the hashed token from URL with the one in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }, // Check if not expired
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or Expired Token");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  // Save new password
  user.password = password;
  // Clear the reset fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ message: "Password Reset Successful, please login" });
});

module.exports = {
  registerUser,
  verifyUser,
  loginUser,
  logoutUser,
  getUser,
  loginStatus,
  updateUser, 
  changePassword,
  forgotPassword,
  resetPassword,
};
