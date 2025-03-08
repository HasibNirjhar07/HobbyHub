const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { ensureAuthenticated } = require('../middleware/auth');

// Feed page - GET
router.get('/', ensureAuthenticated, feedController.getFeedPage);

module.exports = router;