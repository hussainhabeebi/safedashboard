const express = require('express');
const router = express.Router();
const nocodb = require('../services/nocodb');

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

module.exports = router;
