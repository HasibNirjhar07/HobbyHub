const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // For local authentication
  username: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: false // Not required for OAuth users
  },
  // For Google OAuth
  googleId: {
    type: String,
    required: false
  },
  displayName: {
    type: String,
    required: false
  },
  photo: {
    type: String,
    required: false
  },
  // Social features
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Common fields
  bio: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);