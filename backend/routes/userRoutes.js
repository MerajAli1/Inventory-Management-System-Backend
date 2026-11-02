const express = require("express");
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getUser, 
  loginStatus,
  updateUser, 
  changePassword, 
  forgotPassword,
  resetPassword,
  verifyUser
} = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/loggedin", loginStatus);
router.patch("/verify/:verificationToken", verifyUser);

// Private Routes (Protected)
router.get("/getuser", protect, getUser);
router.patch("/updateuser", protect, updateUser); 
router.patch("/changepassword", protect, changePassword);
// Forget Password Routes
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

module.exports = router;