const multer = require('multer');

// 1. Storage Configuration
// We use memoryStorage to keep the file in buffer (RAM)
// accessible via req.file.buffer for the AWS SDK to consume directly.
const storage = multer.memoryStorage();

// 2. File Filter (Security)
// Reject non-image files to prevent malicious uploads.
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// 3. Multer Instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit: 5MB
  },
  fileFilter: fileFilter,
});

module.exports = upload;