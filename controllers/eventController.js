const Event = require('../models/Event');
const Registration = require('../models/Registration');

// @desc    Get all events (with optional category filter)
// @route   GET /api/events?category=Workshop
const getEvents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single event by id
// @route   GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create event (admin only)
// @route   POST /api/events
const createEvent = async (req, res) => {
  try {
    const { title, description, category, date, location, capacity } = req.body;

    const event = await Event.create({
      title,
      description,
      category,
      date,
      location,
      capacity,
      createdBy: req.admin ? req.admin._id : undefined
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update event (admin only)
// @route   PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete/cancel event (admin only)
// @route   DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event cancelled', event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all registrations for a given event (admin only)
// @route   GET /api/events/:id/registrations
const getEventRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.id }).sort({
      status: 1,
      createdAt: 1
    });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations
};
