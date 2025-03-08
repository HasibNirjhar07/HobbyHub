// config/db.js
const mongoose = require('mongoose');

// MongoDB connection URI
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/auth-app';

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });