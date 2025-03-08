const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/profile');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// File filter for profile pictures
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  // Check extension and mimetype
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only image files are allowed!'));
  }
};

// Initialize multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// User profile - GET
router.get('/profile/:id', ensureAuthenticated, userController.getUserProfile);

// Edit profile form - GET
router.get('/edit-profile', ensureAuthenticated, userController.showEditProfileForm);

// Update profile - PUT
router.post('/edit-profile', ensureAuthenticated, upload.single('photo'), userController.updateProfile);

// Follow user - POST
router.post('/follow/:id', ensureAuthenticated, userController.followUser);

// Unfollow user - POST
router.post('/unfollow/:id', ensureAuthenticated, userController.unfollowUser);

// Search users - GET
router.get('/search', ensureAuthenticated, userController.searchUsers);

// Get user's following list - GET
router.get('/:id/following', ensureAuthenticated, userController.getFollowing);

// Get user's followers list - GET
router.get('/:id/followers', ensureAuthenticated, userController.getFollowers);

module.exports = router;