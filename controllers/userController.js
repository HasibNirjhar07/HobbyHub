const User = require('../models/User');
const Post = require('../models/Post');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username displayName photo')
      .populate('following', 'username displayName photo');
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/feed');
    }
    
    // Get user's posts
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 });
    
    // Check if the viewing user is following this user
    const isFollowing = req.user.following.some(
      followedUser => followedUser._id.toString() === user._id.toString()
    );
    
    res.render('users/profile', {
      title: user.username || user.displayName,
      profileUser: user,
      posts,
      isFollowing,
      isSelf: req.user._id.toString() === user._id.toString()
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading profile');
    res.redirect('/feed');
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    // Get the user to follow
    const userToFollow = await User.findById(req.params.id);
    
    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent following oneself
    if (req.user._id.toString() === userToFollow._id.toString()) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    // Check if already following
    const isFollowing = req.user.following.some(
      id => id.toString() === userToFollow._id.toString()
    );
    
    if (isFollowing) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    
    // Add to following
    await User.findByIdAndUpdate(req.user._id, {
      $push: { following: userToFollow._id }
    });
    
    // Add to followers
    await User.findByIdAndUpdate(userToFollow._id, {
      $push: { followers: req.user._id }
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    // Get the user to unfollow
    const userToUnfollow = await User.findById(req.params.id);
    
    if (!userToUnfollow) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if actually following
    const isFollowing = req.user.following.some(
      id => id.toString() === userToUnfollow._id.toString()
    );
    
    if (!isFollowing) {
      return res.status(400).json({ error: 'Not following this user' });
    }
    
    // Remove from following
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: userToUnfollow._id }
    });
    
    // Remove from followers
    await User.findByIdAndUpdate(userToUnfollow._id, {
      $pull: { followers: req.user._id }
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    
    if (!searchTerm) {
      return res.render('users/search', {
        title: 'Search Users',
        users: [],
        searchTerm: ''
      });
    }
    
    // Search by username, displayName or email
    const users = await User.find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { displayName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    });
    
    res.render('users/search', {
      title: 'Search Results',
      users,
      searchTerm
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error searching users');
    res.redirect('/feed');
  }
};

// Show edit profile form
exports.showEditProfileForm = async (req, res) => {
  res.render('users/edit-profile', {
    title: 'Edit Profile',
    user: req.user
  });
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    
    // Update profile picture if provided
    let photo = req.user.photo;
    if (req.file) {
      photo = `/uploads/profile/${req.file.filename}`;
    }
    
    await User.findByIdAndUpdate(req.user._id, {
      username,
      bio,
      photo
    });
    
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect(`/users/profile/${req.user._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('/users/edit-profile');
  }
};

// Get following list
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username displayName photo');
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/feed');
    }
    
    res.render('users/following', {
      title: `${user.username || user.displayName}'s Following`,
      user,
      following: user.following
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading following list');
    res.redirect('/feed');
  }
};

// Get followers list
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username displayName photo');
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/feed');
    }
    
    res.render('users/followers', {
      title: `${user.username || user.displayName}'s Followers`,
      user,
      followers: user.followers
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading followers list');
    res.redirect('/feed');
  }
};