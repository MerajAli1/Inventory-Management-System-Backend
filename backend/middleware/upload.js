const multer = require("multer");

// Define file storage location
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Files will be saved in the 'uploads' root folder
  },
  filename: function (req, file, cb) {
    // Generate a unique filename: Date + Original Name (sanitized)
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

// Specify file format restrictions
function fileFilter(req, file, cb) {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true); // Accept file
  } else {
    cb(null, false); // Reject file
  }
}

const upload = multer({ storage, fileFilter });

module.exports = { upload };