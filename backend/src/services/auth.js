const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'eco-sawa-secret';
const TOKEN_EXP = '7d';

async function register({ name, email, password, role = 'donor', phone, lat = null, lng = null }) {
  const id = uuidv4();
  const u = User.build({ id, name, email, role, phone, locationLat: lat, locationLng: lng });
  await u.setPassword(password);
  await u.save();
  const token = jwt.sign({ sub: id, role: u.role }, JWT_SECRET, { expiresIn: TOKEN_EXP });
  return { user: u, token };
}

async function login({ email, password }) {
  const u = await User.findOne({ where: { email } });
  if (!u) throw new Error('Invalid');
  const ok = await u.validatePassword(password);
  if (!ok) throw new Error('Invalid');
  const token = jwt.sign({ sub: u.id, role: u.role }, JWT_SECRET, { expiresIn: TOKEN_EXP });
  return { user: u, token };
}

function middleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'no token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = { register, login, middleware };
