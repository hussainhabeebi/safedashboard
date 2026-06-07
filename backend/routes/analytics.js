const express = require('express');
const router = express.Router();
const n8n = require('../services/n8n');

router.get('/', async (req, res) => {
  try {
    const data = await n8n.getAnalytics();
    // n8n returns: { total, eligible, invited, gulf, byStage, byState, byDegree, byCountry }
    res.json({
      totalLeads:          data.total      ?? 0,
      eligible:            data.eligible   ?? 0,
      invited:             data.invited    ?? 0,
      gulf:                data.gulf       ?? 0,
      leadsByStatus:       data.byStage    ?? {},
      leadsByState:        data.byState    ?? {},
      leadsByDegree:       data.byDegree   ?? {},
      byCountry:           data.byCountry  ?? {},
      // Chatwoot stats not available via n8n analytics endpoint
      conversationsByStatus: { open: 0, resolved: 0, pending: 0 },
    });
  } catch (err) {
    console.error('[analytics] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
