const express = require('express');
const router = express.Router();
const wa = require('../services/whatsapp');

// GET /api/whatsapp/templates
router.get('/templates', async (req, res) => {
  try {
    const data = await wa.getTemplates();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/whatsapp/templates — create a new template
router.post('/templates', async (req, res) => {
  try {
    const { name, category, language, components } = req.body;
    const data = await wa.createTemplate(name, category, language, components);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create template' });
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
  try {
    const { phones, templateName, languageCode = 'en', components = [] } = req.body;
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
    res.status(500).json({ error: 'Failed to send bulk messages' });
  }
});

module.exports = router;
