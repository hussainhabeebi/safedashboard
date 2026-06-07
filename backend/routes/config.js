const express = require('express');
const router = express.Router();
const nocodb = require('../services/nocodb');
const chatwoot = require('../services/chatwoot');

router.get('/', async (req, res) => {
  try {
    const data = await nocodb.getConfig();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

router.patch('/', async (req, res) => {
  try {
    const data = await nocodb.updateConfig(req.body);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { message = 'Test message from Safe Assets Dashboard' } = req.body;
    // Get the first open conversation to send a test message to
    const allConvos = await chatwoot.getConversations();
    const convos = allConvos.payload ?? [];
    const openConvo = convos.find(c => c.status === 'open');
    if (!openConvo) {
      return res.status(404).json({ error: 'No open conversations found to send test message' });
    }
    const result = await chatwoot.sendMessage(openConvo.id, message);
    res.json({ ok: true, conversationId: openConvo.id, message: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send test message' });
  }
});

module.exports = router;
