const express = require('express');
const router = express.Router();
const { cancelRegistration } = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');

router.delete('/:id', protect, cancelRegistration);

module.exports = router;
