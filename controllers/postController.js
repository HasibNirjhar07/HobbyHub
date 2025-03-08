const Post = require('../models/Post');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

module.exports = {
  // Get post feed for authenticated user
  getFeed: async (req, res) => {
    try {
      // Find posts from user and those they follow
      const user = await User.findById(req.user.id).populate('following');
      const followingIds = user.following.map(following => following._id);
      followingIds.push(req.user.id); // Include user's own posts
      
      const posts = await Post.find({ user: { $in: followingIds } })
        .populate('user')
        .sort({ createdAt: -1 });
      
      res.render('posts/feed', { 
        title: 'Your Feed',
        posts,
        user: req.user
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading feed');
      res.redirect('/');
    }
  },

  // Show create post form
  showCreatePostForm: (req, res) => {
    res.render('posts/create', { 
      title: 'Create Post'
    });
  },

  // Create new post
  createPost: async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content && (!req.files || req.files.length === 0)) {
        req.flash('error_msg', 'Post must contain text or media');
        return res.redirect('back');
      }
      
      // Process uploaded files
      let mediaFiles = [];
      if (req.files && req.files.length > 0) {
        mediaFiles = req.files.map(file => {
          const filePath = `/uploads/${file.filename}`;
          let fileType = 'image';
          
          if (file.mimetype.startsWith('video/')) {
            fileType = 'video';
          } else if (file.mimetype.startsWith('audio/')) {
            fileType = 'audio';
          }
          
          return {
            fileType,
            fileName: file.filename,
            filePath
          };
        });
      }
      
      // Create new post
      const newPost = new Post({
        user: req.user.id,
        content: content || '',
        mediaFiles
      });
      
      await newPost.save();
      
      req.flash('success_msg', 'Post created successfully');
      res.redirect('/feed');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error creating post');
      res.redirect('back');
    }
  },

  // Get single post
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id)
        .populate('user');
      
      if (!post) {
        req.flash('error_msg', 'Post not found');
        return res.redirect('/feed');
      }
      
      res.render('posts/view', { 
        title: 'View Post',
        post
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading post');
      res.redirect('/feed');
    }
  },

  // Show edit post form
  showEditPostForm: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        req.flash('error_msg', 'Post not found');
        return res.redirect('/feed');
      }
      
      // Check post ownership
      if (post.user.toString() !== req.user.id) {
        req.flash('error_msg', 'Not authorized');
        return res.redirect('/feed');
      }
      
      res.render('posts/edit', { 
        title: 'Edit Post',
        post
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading post');
      res.redirect('/feed');
    }
  },

  // Update post
  updatePost: async (req, res) => {
    try {
      const { content } = req.body;
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        req.flash('error_msg', 'Post not found');
        return res.redirect('/feed');
      }
      
      // Check post ownership
      if (post.user.toString() !== req.user.id) {
        req.flash('error_msg', 'Not authorized');
        return res.redirect('/feed');
      }
      
      // Process new uploads
      let mediaFiles = [...post.mediaFiles];
      if (req.files && req.files.length > 0) {
        const newMedia = req.files.map(file => {
          const filePath = `/uploads/${file.filename}`;
          let fileType = 'image';
          
          if (file.mimetype.startsWith('video/')) {
            fileType = 'video';
          } else if (file.mimetype.startsWith('audio/')) {
            fileType = 'audio';
          }
          
          return {
            fileType,
            fileName: file.filename,
            filePath
          };
        });
        
        mediaFiles = [...mediaFiles, ...newMedia];
      }
      
      // Update post
      post.content = content;
      post.mediaFiles = mediaFiles;
      post.updatedAt = Date.now();
      
      await post.save();
      
      req.flash('success_msg', 'Post updated successfully');
      res.redirect(`/posts/${post._id}`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error updating post');
      res.redirect('back');
    }
  },

  // Delete post
  deletePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Check post ownership
      if (post.user.toString() !== req.user.id) {
        return res.status(401).json({ error: 'Not authorized' });
      }
      
      // Delete media files
      if (post.mediaFiles && post.mediaFiles.length > 0) {
        post.mediaFiles.forEach(media => {
          const filePath = path.join(__dirname, '../public', media.filePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      
      // Delete post
      await post.remove();
      
      return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  },

// Server-side controller functions

// The issue is in the URL parameter names in the controller methods vs the routes
// Here are the fixed likePost and dislikePost methods:

// Like post method
likePost: async (req, res) => {
  try {
    const postId = req.params.id;
    console.log("Like request received for post", postId);
    
    // Validate postId
    if (!postId || postId === "null" || postId === "undefined") {
      return res.status(400).json({ 
        error: true, 
        message: "Invalid post ID provided" 
      });
    }
    
    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        error: true, 
        message: "Post not found" 
      });
    }
    
    // Make sure to convert to string for consistent comparison
    const userId = req.user.id || req.user._id.toString();
    
    // Check if the user has already liked this post
    const alreadyLiked = post.likes.some(id => id.toString() === userId);
    // Check if the user has disliked this post
    const alreadyDisliked = post.dislikes.some(id => id.toString() === userId);
    
    // If user has disliked, remove from dislikes array
    if (alreadyDisliked) {
      post.dislikes = post.dislikes.filter(
        (dislikeId) => dislikeId.toString() !== userId
      );
    }
    
    // Toggle like status
    if (alreadyLiked) {
      // Remove like
      post.likes = post.likes.filter(
        (likeId) => likeId.toString() !== userId
      );
    } else {
      // Add like
      post.likes.push(userId);
    }
    
    await post.save();
    
    res.status(200).json({
      likes: post.likes.length,
      dislikes: post.dislikes.length,
      userLiked: post.likes.some(id => id.toString() === userId),
      userDisliked: post.dislikes.some(id => id.toString() === userId)
    });
  } catch (error) {
    console.error("Error in likePost:", error);
    res.status(500).json({ 
      error: true, 
      message: "Server error while liking post" 
    });
  }
},

// Dislike post method
dislikePost: async (req, res) => {
  try {
    const postId = req.params.id;
    console.log("Dislike request received for post", postId);
    
    // Validate postId
    if (!postId || postId === "null" || postId === "undefined") {
      return res.status(400).json({ 
        error: true, 
        message: "Invalid post ID provided" 
      });
    }
    
    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        error: true, 
        message: "Post not found" 
      });
    }
    
    // Make sure to convert to string for consistent comparison
    const userId = req.user.id || req.user._id.toString();
    
    // Check if the user has already disliked this post
    const alreadyDisliked = post.dislikes.some(id => id.toString() === userId);
    // Check if the user has liked this post
    const alreadyLiked = post.likes.some(id => id.toString() === userId);
    
    // If user has liked, remove from likes array
    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (likeId) => likeId.toString() !== userId
      );
    }
    
    // Toggle dislike status
    if (alreadyDisliked) {
      // Remove dislike
      post.dislikes = post.dislikes.filter(
        (dislikeId) => dislikeId.toString() !== userId
      );
    } else {
      // Add dislike
      post.dislikes.push(userId);
    }
    
    await post.save();
    
    res.status(200).json({
      likes: post.likes.length,
      dislikes: post.dislikes.length,
      userLiked: post.likes.some(id => id.toString() === userId),
      userDisliked: post.dislikes.some(id => id.toString() === userId)
    });
  } catch (error) {
    console.error("Error in dislikePost:", error);
    res.status(500).json({ 
      error: true, 
      message: "Server error while disliking post" 
    });
  }
},
  // Remove media from post
  removeMedia: async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Check post ownership
      if (post.user.toString() !== req.user.id) {
        return res.status(401).json({ error: 'Not authorized' });
      }
      
      // Find media by filename
      const mediaIndex = post.mediaFiles.findIndex(media => media.fileName === req.params.fileName);
      
      if (mediaIndex === -1) {
        return res.status(404).json({ error: 'Media not found' });
      }
      
      // Delete file from storage
      const filePath = path.join(__dirname, '../public', post.mediaFiles[mediaIndex].filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Remove media from post
      post.mediaFiles.splice(mediaIndex, 1);
      await post.save();
      
      return res.json({ success: true, message: 'Media removed successfully' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
};