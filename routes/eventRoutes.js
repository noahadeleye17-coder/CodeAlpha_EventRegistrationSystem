const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations
} = require('../controllers/eventController');
const { registerForEvent } = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);

router.post('/:id/register', registerForEvent);
router.get('/:id/registrations', protect, getEventRegistrations);

module.exports = router;
