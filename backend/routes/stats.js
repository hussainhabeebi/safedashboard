const express = require('express');
const router = express.Router();
const nocodb = require('../services/nocodb');
const chatwoot = require('../services/chatwoot');

router.get('/', async (req, res) => {
  try {
    const [nocoStats, cwStats] = await Promise.allSettled([
      nocodb.getTodayStats(),
      chatwoot.getTodayStats(),
    ]);

    const noco = nocoStats.status === 'fulfilled' ? nocoStats.value : {};
    const cw   = cwStats.status   === 'fulfilled' ? cwStats.value   : {};

    res.json({
      newLeadsToday:       noco.newLeadsToday       ?? 0,
      openConversations:   cw.openConversations     ?? 0,
      handoversToday:      cw.handoversToday        ?? 0,
      botRepliesToday:     cw.botRepliesToday        ?? 0,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
