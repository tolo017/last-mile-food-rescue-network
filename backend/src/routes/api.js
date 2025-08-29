const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Pickup, Organization } = require('../models');
const instasend = require('./instasend');

// Create pickup
router.post('/pickup', async (req, res) => {
  try {
    const id = uuidv4();
    const { donorName, donorPhone, location, weightKg = 5, perishability = 'medium', orgId = null } = req.body;
    const pickup = await Pickup.create({
      id,
      donorName,
      donorPhone,
      location,
      weightKg,
      perishability,
      status: 'created',
      organizationId: orgId
    });
    return res.json({ ok: true, pickup });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'create failed' });
  }
});

// Book pickup (instasend)
router.post('/pickup/:id/book', async (req, res) => {
  try {
    const { id } = req.params;
    const pickup = await Pickup.findByPk(id);
    if (!pickup) return res.status(404).json({ error: 'not found' });

    const booking = await instasend.createBooking({
      pickupId: pickup.id,
      pickupLocation: pickup.location,
      pickupPhone: pickup.donorPhone,
      weightKg: pickup.weightKg
    });

    pickup.instasendBookingId = booking.id;
    pickup.status = booking.status || 'booked';
    const bookingFee = booking.fee_cents || 0;
    const platformPct = Number(process.env.PLATFORM_FEE_PERCENT || 10);
    pickup.platformFeeCents = Math.round(platformPct * bookingFee / 100);
    pickup.totalFeeCents = bookingFee + pickup.platformFeeCents;
    await pickup.save();

    return res.json({ ok: true, pickup });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'booking failed' });
  }
});

// simple list pickups
router.get('/pickups', async (req, res) => {
  const items = await Pickup.findAll({ order: [['createdAt','DESC']], limit: 200 });
  res.json({ ok: true, items });
});

// webhook endpoint for InstaSend
router.post('/webhook/instasend', express.raw({ type: '*/*' }), require('./instasend').webhookHandler);

module.exports = router;
