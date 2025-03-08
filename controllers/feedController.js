const Post = require('../models/Post');

exports.getFeedPage = async (req, res) => {
  try {
    // Get the current user's ID and following list
    const userId = req.user._id;
    const following = req.user.following || [];
    
    // Find posts from users that the current user is following, and the user's own posts
    const posts = await Post.find({
      $or: [
        { user: { $in: following } },
        { user: userId }
      ]
    })
    .populate('user', 'username displayName photo')
    .sort({ createdAt: -1 });

    res.render('feed/index', {
      title: 'Feed',
      user: req.user,
      posts: posts
    });
  } catch (err) {
    console.error(err);
    res.render('feed/index', {
      title: 'Feed',
      user: req.user,
      posts: []
    });
  }
};