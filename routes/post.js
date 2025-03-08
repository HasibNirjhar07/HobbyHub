const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { ensureAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|avi|mov|mp3|wav|ogg/;
  // Check extension and mimetype
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: File type not supported!'));
  }
};

// Initialize multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    req.flash('error_msg', `Upload error: ${err.message}`);
    return res.redirect('back');
  } else if (err) {
    req.flash('error_msg', err.message);
    return res.redirect('back');
  }
  next();
};

// Posts feed - GET
router.get('/', ensureAuthenticated, postController.getFeed);

// Create post form - GET
router.get('/create', ensureAuthenticated, postController.showCreatePostForm);

// Create post - POST
router.post('/create', 
  ensureAuthenticated, 
  upload.array('media', 5), 
  handleMulterError, 
  postController.createPost
);

// View single post - GET
router.get('/:id', ensureAuthenticated, postController.getPost);

// Edit post form - GET
router.get('/edit/:id', ensureAuthenticated, postController.showEditPostForm);

// Update post - PUT
router.put('/edit/:id', 
  ensureAuthenticated, 
  upload.array('media', 5), 
  handleMulterError, 
  postController.updatePost
);

// Update post - POST (alternative for browsers that don't support PUT)
router.post('/edit/:id', 
  ensureAuthenticated, 
  upload.array('media', 5), 
  handleMulterError, 
  postController.updatePost
);

// Delete post - DELETE
router.delete('/:id', ensureAuthenticated, postController.deletePost);

// Excerpt for the like/dislike routes

// Like post - POST
router.post('/:id/like', ensureAuthenticated, (req, res) => {
  console.log(`Like request received for post ${req.params.id}`);
  postController.likePost(req, res);
});

// Dislike post - POST
router.post('/:id/dislike', ensureAuthenticated, (req, res) => {
  console.log(`Dislike request received for post ${req.params.id}`);
  postController.dislikePost(req, res);
});

// Remove media from post - DELETE
router.delete('/:postId/media/:fileName', ensureAuthenticated, postController.removeMedia);

// Add these routes to your existing postRoutes.js file

// Add a comment to a post
router.post('/:id/comments', ensureAuthenticated, postController.addComment);

// Get comments for a post
router.get('/:id/comments', ensureAuthenticated, postController.getComments);

// Update a comment
router.put('/comments/:commentId', ensureAuthenticated, postController.updateComment);

// Delete a comment
router.delete('/comments/:commentId', ensureAuthenticated, postController.deleteComment);

// Like a comment
router.post('/comments/:commentId/like', ensureAuthenticated, postController.likeComment);

// Dislike a comment
router.post('/comments/:commentId/dislike', ensureAuthenticated, postController.dislikeComment);

module.exports = router;