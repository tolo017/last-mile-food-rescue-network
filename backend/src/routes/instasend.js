const { Pickup } = require('../models');

const webhookHandler = async (req, res) => {
  // NOTE: This is a minimal demo webhook handler.
  // InstaSend will POST JSON; express.raw used above so parse explicitly.
  let body;
  try {
    body = JSON.parse(req.body.toString());
  } catch (e) {
    return res.status(400).send('invalid json');
  }

  const event = body.event || body.type || null;
  const data = body.data || body.payload || {};
  // Example event names: booking.created, booking.updated
  if (event && (event.includes('booking') || event.includes('booking.updated'))) {
    const bookingId = data.booking_id || data.id || data.bookingId || data.id;
    const status = data.status || data.state || data.booking_status;
    if (bookingId) {
      const p = await Pickup.findOne({ where: { instasendBookingId: bookingId } });
      if (p) {
        p.status = status === 'completed' ? 'completed' : status || p.status;
        await p.save();
        console.log('Updated pickup', p.id, 'to', p.status);
      }
    }
  }
  return res.json({ ok: true });
};

module.exports = { webhookHandler };
