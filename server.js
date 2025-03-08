const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const path = require('path');
const dotenv = require('dotenv');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Database connection
require('./config/db');

// Passport config
require('./config/passport')(passport);

const app = express();

// EJS setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Method override for PUT and DELETE requests
app.use(methodOverride('_method'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Express session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret_key',
  resave: false,
  saveUninitialized: false
}));

// CORS setup instead of CSRF
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/feed', require('./routes/feed'));
app.use('/posts', require('./routes/post'));
app.use('/users', require('./routes/user'));

// Handle 404
// app.use((req, res) => {
//   res.status(404).render('404', { title: 'Page Not Found' });
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));