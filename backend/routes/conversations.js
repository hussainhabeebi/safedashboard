const express = require('express');
const router = express.Router();
const n8n = require('../services/n8n');

router.get('/', async (req, res) => {
  try {
    const data = await n8n.getConversations();
    res.json(data);
  } catch (err) {
    console.error('[conversations] list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const msgs = await n8n.getMessages(req.params.id);
    res.json({ payload: msgs });
  } catch (err) {
    console.error('[conversations] messages error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch messages' });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content is required' });
    const data = await n8n.sendReply(req.params.id, content.trim());
    res.json({ payload: data });
  } catch (err) {
    console.error('[conversations] send reply error:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/:id/handover', async (req, res) => {
  try {
    const data = await n8n.toggleStatus(req.params.id, 'open');
    res.json(data);
  } catch (err) {
    console.error('[conversations] handover error:', err.message);
    res.status(500).json({ error: 'Failed to handover conversation' });
  }
});

router.post('/:id/toggle-status', async (req, res) => {
  try {
    const { status = 'resolved' } = req.body;
    const data = await n8n.toggleStatus(req.params.id, status);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle status' });
  }
});

// Contacts — still use Chatwoot directly (not in n8n workflow)
const chatwoot = require('../services/chatwoot');

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

module.exports = router;
