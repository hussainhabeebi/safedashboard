const express = require('express');
const router = express.Router();
const chatwoot = require('../services/chatwoot');

router.get('/', async (req, res) => {
  try {
    const data = await chatwoot.getConversations();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const data = await chatwoot.getMessages(req.params.id);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:id/handover', async (req, res) => {
  try {
    const data = await chatwoot.assignToAgent(req.params.id);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to handover conversation' });
  }
});

module.exports = router;
