const express = require('express');
const router = express.Router();
const wa = require('../services/whatsapp');

// GET /api/whatsapp/templates
router.get('/templates', async (req, res) => {
  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
    return res.status(503).json({ error: 'WhatsApp not configured. Set WHATSAPP_API_TOKEN and WHATSAPP_BUSINESS_ACCOUNT_ID in environment.' });
  }
  try {
    const data = await wa.getTemplates();
    res.json(data);
  } catch (err) {
    console.error('WA getTemplates error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || 'Failed to fetch templates' });
  }
});

// POST /api/whatsapp/templates — create a new template
router.post('/templates', async (req, res) => {
  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
    return res.status(503).json({ error: 'WhatsApp not configured. Set WHATSAPP_API_TOKEN and WHATSAPP_BUSINESS_ACCOUNT_ID in environment.' });
  }
  try {
    const { name, category, language, components } = req.body;
    const data = await wa.createTemplate(name, category, language, components);
    res.json(data);
  } catch (err) {
    console.error('WA createTemplate error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || 'Failed to create template' });
  }
});

// POST /api/whatsapp/send — send to single number
router.post('/send', async (req, res) => {
  try {
    const { to, templateName, languageCode, components } = req.body;
    const data = await wa.sendTemplate(to, templateName, languageCode, components);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/whatsapp/bulk — send to selected leads
router.post('/bulk', async (req, res) => {
  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return res.status(503).json({ error: 'WhatsApp not configured. Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment.' });
  }
  try {
    const { phones, templateName, languageCode = 'en_US', components = [] } = req.body;
    if (!phones?.length || !templateName) {
      return res.status(400).json({ error: 'phones and templateName are required' });
    }
    const results = await wa.sendBulkTemplate(phones, templateName, languageCode, components);
    res.json({
      results,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
    });
  } catch (err) {
    console.error('WA bulk send error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || 'Failed to send bulk messages' });
  }
});

module.exports = router;
