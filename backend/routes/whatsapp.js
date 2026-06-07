const express = require('express');
const router = express.Router();
const n8n = require('../services/n8n');
const wa = require('../services/whatsapp');

// GET /api/whatsapp/templates — via n8n
router.get('/templates', async (req, res) => {
  if (!process.env.N8N_WEBHOOK_BASE_URL) {
    return res.status(503).json({ error: 'N8N_WEBHOOK_BASE_URL not configured' });
  }
  try {
    const data = await n8n.getTemplates();
    res.json(data);
  } catch (err) {
    console.error('[whatsapp] templates error:', err.message);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/whatsapp/templates — create template via Meta directly (not in n8n)
router.post('/templates', async (req, res) => {
  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
    return res.status(503).json({ error: 'WHATSAPP_API_TOKEN and WHATSAPP_BUSINESS_ACCOUNT_ID required' });
  }
  try {
    const { name, category, language, components } = req.body;
    const data = await wa.createTemplate(name, category, language, components);
    res.json(data);
  } catch (err) {
    console.error('[whatsapp] create template error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || 'Failed to create template' });
  }
});

// POST /api/whatsapp/bulk — bulk template send via n8n
// Body: { leads: [{slno, name, phone, state, degree, is_gulf}], templateName, language, vars }
router.post('/bulk', async (req, res) => {
  if (!process.env.N8N_WEBHOOK_BASE_URL) {
    return res.status(503).json({ error: 'N8N_WEBHOOK_BASE_URL not configured' });
  }
  try {
    const { leads, templateName, language = 'en_US', vars = {} } = req.body;
    if (!leads?.length || !templateName) {
      return res.status(400).json({ error: 'leads and templateName are required' });
    }
    const data = await n8n.sendBulkTemplate(leads, templateName, language, vars);
    res.json(data);
  } catch (err) {
    console.error('[whatsapp] bulk send error:', err.message);
    res.status(500).json({ error: 'Failed to send bulk messages' });
  }
});

module.exports = router;
