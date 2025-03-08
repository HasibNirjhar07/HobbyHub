const User = require('../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');

exports.getLoginPage = (req, res) => {
  res.render('auth/login', { title: 'Login' });
};

exports.getRegisterPage = (req, res) => {
  res.render('auth/register', { title: 'Register' });
};

exports.registerUser = async (req, res) => {
  const { username, email, password, password2 } = req.body;
  const errors = [];

  // Validation
  if (!username || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.render('auth/register', {
      title: 'Register',
      errors,
      username,
      email
    });
  }

  try {
    // Check if email already exists
    const user = await User.findOne({ email });
    
    if (user) {
      // Email already registered
      if (user.googleId && !user.password) {
        errors.push({ msg: 'Email already registered with Google. Please login with Google.' });
      } else {
        errors.push({ msg: 'Email already registered' });
      }
      
      return res.render('auth/register', {
        title: 'Register',
        errors,
        username,
        email
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);
    
    // Save user
    await newUser.save();
    
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/register');
  }
};

exports.loginUser = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/feed',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
};

exports.logoutUser = (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/login');
};
// Google OAuth handlers
exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleCallback = passport.authenticate('google', {
  successRedirect: '/feed',
  failureRedirect: '/login',
  failureFlash: true
});