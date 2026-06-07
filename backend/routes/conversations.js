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

router.get('/contacts', async (req, res) => {
  try {
    const { page = 1, search = '' } = req.query;
    const data = await chatwoot.getContacts(Number(page), search);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.get('/contacts/:id/conversations', async (req, res) => {
  try {
    const data = await chatwoot.getContactConversations(req.params.id);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch contact conversations' });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const data = await chatwoot.getMessages(req.params.id);
    console.log(`[messages] conv ${req.params.id} payload length:`, data?.payload?.length, 'sample:', JSON.stringify(data?.payload?.[0])?.slice(0, 200));
    res.json(data);
  } catch (err) {
    console.error('[messages] error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || err.message || 'Failed to fetch messages' });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }
    const data = await chatwoot.sendMessage(req.params.id, content.trim());
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to send message' });
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
