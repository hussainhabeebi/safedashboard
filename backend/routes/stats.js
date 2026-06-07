const express = require('express');
const router = express.Router();
const nocodb = require('../services/nocodb');
const chatwoot = require('../services/chatwoot');

router.get('/', async (req, res) => {
  try {
    const [nocoStats, nocoTotal, cwStats, analyticsData] = await Promise.allSettled([
      nocodb.getTodayStats(),
      nocodb.getTotalLeads(),
      chatwoot.getTodayStats(),
      nocodb.getLeadsAnalytics(),
    ]);

    const noco     = nocoStats.status     === 'fulfilled' ? nocoStats.value     : {};
    const nocoTot  = nocoTotal.status     === 'fulfilled' ? nocoTotal.value     : {};
    const cw       = cwStats.status       === 'fulfilled' ? cwStats.value       : {};
    const analytics = analyticsData.status === 'fulfilled' ? analyticsData.value : {};

    res.json({
      newLeadsToday:       noco.newLeadsToday         ?? 0,
      totalContacts:       nocoTot.totalContacts      ?? 0,
      openConversations:   cw.openConversations       ?? 0,
      resolvedConversations: cw.resolvedConversations ?? 0,
      pendingConversations: cw.pendingConversations   ?? 0,
      handoversToday:      cw.handoversToday          ?? 0,
      botRepliesToday:     cw.botRepliesToday          ?? 0,
      conversationsByStatus: cw.conversationsByStatus ?? { open: 0, resolved: 0, pending: 0 },
      leadsByStatus:       analytics.byStatus         ?? {},
      leadsLast7Days:      analytics.last7Days        ?? {},
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
