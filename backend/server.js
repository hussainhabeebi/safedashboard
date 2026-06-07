require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const conversationsRoutes = require('./routes/conversations');
const statsRoutes = require('./routes/stats');
const configRoutes = require('./routes/config');
const analyticsRoutes = require('./routes/analytics');
const authMiddleware = require('./middleware/auth');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://dashboard.safeassetsofficial.com',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/leads', authMiddleware, leadsRoutes);
app.use('/api/conversations', authMiddleware, conversationsRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);
app.use('/api/config', authMiddleware, configRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.json({ ok: true });
});

// Serve React app in production
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global error handler — never expose stack traces
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Safe Assets Dashboard running on port ${PORT}`));
