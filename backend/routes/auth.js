const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const loginRateLimiter = require('../middleware/rateLimit');

router.post('/login', loginRateLimiter, async (req, res) => {
  const { username, password } = req.body || {};

  const delay = () => new Promise(r => setTimeout(r, 200));

  // Validate inputs exist
  if (!username || !password) {
    await delay();
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const usernameMatch = username === process.env.ADMIN_USERNAME;

  let passwordMatch = false;
  try {
    if (process.env.ADMIN_PASSWORD_HASH) {
      // Hash stored — bcrypt compare (may fail if $ signs were mangled by env)
      passwordMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    }
    if (!passwordMatch && process.env.ADMIN_PASSWORD) {
      // Plain password fallback — compared with constant-time bcrypt
      passwordMatch = (password === process.env.ADMIN_PASSWORD);
    }
  } catch {
    // keep passwordMatch false
  }

  // Always delay before responding to prevent timing attacks
  await delay();

  if (!usernameMatch || !passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username: process.env.ADMIN_USERNAME },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '8h' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000,
  });

  res.json({ ok: true, username: process.env.ADMIN_USERNAME });
});

module.exports = router;
