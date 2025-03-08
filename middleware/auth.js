module.exports = {
  // Ensure user is authenticated
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/login');
  },
  
  // Ensure user is NOT authenticated (for login/register pages)
  forwardAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/feed');
  }
};