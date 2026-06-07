const express = require('express');
const router = express.Router();
const nocodb = require('../services/nocodb');
const chatwoot = require('../services/chatwoot');

router.get('/', async (req, res) => {
  try {
    const [analyticsResult, cwResult] = await Promise.allSettled([
      nocodb.getLeadsAnalytics(),
      chatwoot.getTodayStats(),
    ]);

    const analytics = analyticsResult.status === 'fulfilled' ? analyticsResult.value : {};
    const cw        = cwResult.status         === 'fulfilled' ? cwResult.value        : {};

    res.json({
      leadsByStatus:     analytics.byStatus   ?? {},
      leadsByInterest:   analytics.byInterest ?? {},
      leadsByDate:       analytics.byDate     ?? {},
      leadsLast7Days:    analytics.last7Days  ?? {},
      leadsByLanguage:   analytics.byLanguage ?? {},
      totalLeads:        analytics.total      ?? 0,
      conversationsByStatus: cw.conversationsByStatus ?? { open: 0, resolved: 0, pending: 0 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
