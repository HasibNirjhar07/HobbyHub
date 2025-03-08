const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function(passport) {
  // Local Strategy (username/password)
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findOne({ email });
        
        // User not found
        if (!user) {
          return done(null, false, { message: 'Email is not registered' });
        }

        // User was registered via Google OAuth
        if (!user.password) {
          return done(null, false, { message: 'Please login with Google' });
        }

        // Check password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      } catch (err) {
        return done(err);
      }
    })
  );

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          return done(null, user);
        }
        
        // Check if user exists with the same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Update existing user with Google info
          user.googleId = profile.id;
          user.displayName = profile.displayName;
          if (profile.photos && profile.photos.length > 0) {
            user.photo = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }
        
        // Create new user
        const newUser = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          displayName: profile.displayName,
          photo: profile.photos ? profile.photos[0].value : null
        });
        
        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};