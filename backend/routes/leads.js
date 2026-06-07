const express = require('express');
const router = express.Router();
const nocodb = require('../services/nocodb');

router.get('/', async (req, res) => {
  try {
    const { filter, sort, search, limit, offset } = req.query;
    const data = await nocodb.getLeads({ filter, sort, search, limit, offset });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = await nocodb.updateLead(req.params.id, req.body);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

module.exports = router;
