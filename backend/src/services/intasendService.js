const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const INTA_BASE = process.env.INTA_API_BASE || '';

async function createBooking({ pickupId, pickupLocation, pickupPhone, weightKg = 5 }) {
  // If INTA_API_BASE is not configured (default), simulate a booking for demo.
  if (!INTA_BASE || INTA_BASE.includes('example')) {
    return {
      id: 'sim-' + uuidv4(),
      fee_cents: 500, // demo $5
      status: 'booked'
    };
  }
  // For real IntaSend integration, ensure credentials and API shape match provider
  const resp = await axios.post(`${INTA_BASE}/bookings`, {
    reference: pickupId,
    pickup_location: pickupLocation,
    pickup_phone: pickupPhone,
    weight_kg: weightKg
  }, {
    headers: { Authorization: `Bearer ${process.env.INTA_CLIENT_SECRET}` }
  });
  return resp.data;
}

module.exports = { createBooking };
