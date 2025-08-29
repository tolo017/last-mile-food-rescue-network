const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Pickup, Organization, User, Subscription, Listing, Notification, Impact } = require('../models');
const instasend = require('./instasend');
const auth = require('../services/auth');

// Auth
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'donor', phone, lat = null, lng = null } = req.body;
    const r = await auth.register({ name, email, password, role, phone, lat, lng });
    res.json({ ok: true, user: r.user, token: r.token });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'register failed' });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await auth.login({ email, password });
    res.json({ ok: true, user: r.user, token: r.token });
  } catch (e) {
    res.status(401).json({ error: 'invalid credentials' });
  }
});

// SSE notifications
const sseClients = new Map(); // userId -> res
router.get('/events', auth.middleware, (req, res) => {
  const userId = req.userId;
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive'
  });
  res.flushHeaders();
  res.write('retry: 10000\n\n');
  sseClients.set(userId, res);
  req.on('close', () => sseClients.delete(userId));
});

async function pushNotification(userId, message) {
  const nid = uuidv4();
  await Notification.create({ id: nid, userId, message });
  const res = sseClients.get(userId);
  if (res) res.write(`data: ${JSON.stringify({ id: nid, message })}\n\n`);
}

// Create pickup (authenticated)
router.post('/pickup', auth.middleware, async (req, res) => {
  try {
    const id = uuidv4();
    const { donorName, donorPhone, location, weightKg = 5, perishability = 'medium', orgId = null, lat = null, lng = null } = req.body;
    const pickup = await Pickup.create({
      id, donorName, donorPhone, location, weightKg, perishability, status: 'created', organizationId: orgId, createdAt: new Date()
    });
    const donor = await User.findByPk(req.userId);
    if (donor) {
      donor.reputationScore = (donor.reputationScore || 0) + 1;
      if (lat && lng) { donor.locationLat = lat; donor.locationLng = lng; }
      await donor.save();
      // notify charities (simulated)
      const charities = await User.findAll({ where: { role: 'charity' }, limit: 20 });
      for (const c of charities) pushNotification(c.id, `New pickup: ${pickup.location} (${pickup.perishability})`);
    }
    return res.json({ ok: true, pickup });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'create failed' });
  }
});

// Book pickup (intasend)
router.post('/pickup/:id/book', auth.middleware, async (req, res) => {
  try {
    const { id } = req.params;
    const pickup = await Pickup.findByPk(id);
    if (!pickup) return res.status(404).json({ error: 'not found' });

    const booking = await intasend.createBooking({
      pickupId: pickup.id,
      pickupLocation: pickup.location,
      pickupPhone: pickup.donorPhone,
      weightKg: pickup.weightKg
    });

    pickup.intasendBookingId = booking.id;
    pickup.status = booking.status || 'booked';
    const bookingFee = booking.fee_cents || 0;
    const platformPct = Number(process.env.PLATFORM_FEE_PERCENT || 10);
    pickup.platformFeeCents = Math.round(platformPct * bookingFee / 100);
    pickup.totalFeeCents = bookingFee + pickup.platformFeeCents;
    await pickup.save();

    const meals = Math.max(1, Math.round((pickup.weightKg || 1) * 0.5 * 4));
    await Impact.create({ id: uuidv4(), pickupId: pickup.id, kgDiverted: pickup.weightKg || 0, mealsEstimated: meals, donorId: req.userId, organizationId: pickup.organizationId });

    pushNotification(req.userId, `Pickup ${pickup.id} booked. Fee: ${pickup.totalFeeCents/100} USD`);
    return res.json({ ok: true, pickup });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'booking failed' });
  }
});

// List pickups
router.get('/pickups', auth.middleware, async (req, res) => {
  const items = await Pickup.findAll({ order: [['createdAt','DESC']], limit: 200 });
  res.json({ ok: true, items });
});

// Me / reputation
router.get('/me', auth.middleware, async (req, res) => {
  const u = await User.findByPk(req.userId);
  res.json({ ok: true, user: u });
});

// Subscriptions (stub)
router.post('/subscribe', auth.middleware, async (req, res) => {
  const { plan } = req.body;
  const id = uuidv4();
  const start = new Date();
  const expires = new Date(Date.now() + 30*24*3600*1000);
  await Subscription.create({ id, userId: req.userId, plan, status: 'active', startedAt: start, expiresAt: expires });
  res.json({ ok: true, subscription: { id, plan, startedAt: start, expiresAt: expires }, message: 'Subscription created (demo).' });
});

// Marketplace listing
router.post('/listing', auth.middleware, async (req, res) => {
  const { title, description, priceCents, promotedDays = 0 } = req.body;
  const id = uuidv4();
  const promotedUntil = promotedDays > 0 ? new Date(Date.now() + promotedDays*24*3600*1000) : null;
  const listing = await Listing.create({ id, title, description, priceCents, vendorId: req.userId, promotedUntil, sponsored: !!promotedDays });
  res.json({ ok: true, listing });
});

// Sponsor/promote
router.post('/sponsor/:listingId', auth.middleware, async (req, res) => {
  const listing = await Listing.findByPk(req.params.listingId);
  if (!listing) return res.status(404).json({ error: 'listing not found' });
  const days = Number(req.body.days || 7);
  listing.sponsored = true;
  listing.promotedUntil = new Date(Date.now() + days*24*3600*1000);
  await listing.save();
  res.json({ ok: true, listing, message: 'Promoted (demo).' });
});

// Notifications
router.get('/notifications', auth.middleware, async (req, res) => {
  const items = await Notification.findAll({ where: { userId: req.userId }, order: [['createdAt','DESC']], limit: 50 });
  res.json({ ok: true, items });
});

// Impact metrics
router.get('/metrics/impact', auth.middleware, async (req, res) => {
  const impacts = await Impact.findAll();
  const totalKg = impacts.reduce((s,i) => s + (i.kgDiverted || 0), 0);
  const totalMeals = impacts.reduce((s,i) => s + (i.mealsEstimated || 0), 0);
  res.json({ ok: true, totalKg, totalMeals, pickups: impacts.length });
});

module.exports = router;
