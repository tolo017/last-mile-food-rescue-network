const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const INSTA_BASE = process.env.INSTA_API_BASE || '';

async function createBooking({ pickupId, pickupLocation, pickupPhone, weightKg = 5 }) {
  // If INSTA_API_BASE is not configured (default), simulate a booking for demo.
  if (!INSTA_BASE || INSTA_BASE.includes('example')) {
    return {
      id: 'sim-' + uuidv4(),
      fee_cents: 500, // demo $5
      status: 'booked'
    };
  }
  // For real InstaSend integration, ensure credentials and API shape match provider
  const resp = await axios.post(`${INSTA_BASE}/bookings`, {
    reference: pickupId,
    pickup_location: pickupLocation,
    pickup_phone: pickupPhone,
    weight_kg: weightKg
  }, {
    headers: { Authorization: `Bearer ${process.env.INSTA_CLIENT_SECRET}` }
  });
  return resp.data;
}

module.exports = { createBooking };
