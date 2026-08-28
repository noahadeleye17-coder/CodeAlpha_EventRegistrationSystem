const Event = require('../models/Event');
const Registration = require('../models/Registration');

// @desc    Register for an event
// @route   POST /api/events/:id/register
// Handles capacity + waitlist atomically to avoid race conditions when
// multiple people register for the last spot at the same time.
const registerForEvent = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status === 'cancelled') {
      return res.status(400).json({ message: 'This event has been cancelled' });
    }

    const existing = await Registration.findOne({ event: eventId, email });
    if (existing) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // Atomic capacity check: only increments registeredCount if there is
    // still room. If two requests race for the last spot, only one of
    // these findOneAndUpdate calls will succeed in incrementing it.
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, $expr: { $lt: ['$registeredCount', '$capacity'] } },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    let registration;

    if (updatedEvent) {
      // Spot was available and claimed
      registration = await Registration.create({
        event: eventId,
        name,
        email,
        phone,
        status: 'confirmed'
      });
    } else {
      // Event is full -> add to waitlist
      const waitlistCount = await Registration.countDocuments({
        event: eventId,
        status: 'waitlisted'
      });

      registration = await Registration.create({
        event: eventId,
        name,
        email,
        phone,
        status: 'waitlisted',
        waitlistPosition: waitlistCount + 1
      });
    }

    res.status(201).json(registration);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    res.status(500).json({ message: err.message });
  }
};

// @desc    Cancel a registration; promotes the oldest waitlisted person if
//          the cancelled registration was confirmed
// @route   DELETE /api/registrations/:id
const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const wasConfirmed = registration.status === 'confirmed';
    registration.status = 'cancelled';
    await registration.save();

    if (wasConfirmed) {
      // Free up the spot
      await Event.findByIdAndUpdate(registration.event, { $inc: { registeredCount: -1 } });

      // Promote the oldest waitlisted registration, if any
      const nextInLine = await Registration.findOne({
        event: registration.event,
        status: 'waitlisted'
      }).sort({ waitlistPosition: 1 });

      if (nextInLine) {
        nextInLine.status = 'confirmed';
        nextInLine.waitlistPosition = null;
        await nextInLine.save();
        await Event.findByIdAndUpdate(registration.event, { $inc: { registeredCount: 1 } });
      }
    }

    res.json({ message: 'Registration cancelled', registration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerForEvent, cancelRegistration };
