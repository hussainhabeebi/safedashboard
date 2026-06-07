const express = require('express');
const router = express.Router();
const n8n = require('../services/n8n');

router.get('/', async (req, res) => {
  try {
    const { search = '', filter = '', limit = 50, offset = 0 } = req.query;
    let leads = await n8n.getLeads();

    // Filter by stage
    if (filter && filter !== 'All') {
      leads = leads.filter(l => (l.stage || l.Stage || '').toLowerCase() === filter.toLowerCase());
    }

    // Search by name or phone
    if (search.trim()) {
      const q = search.toLowerCase();
      leads = leads.filter(l =>
        (l.name || l.Name || '').toLowerCase().includes(q) ||
        (l.phone || l['Phone Number'] || '').includes(q)
      );
    }

    const total = leads.length;
    const list = leads.slice(Number(offset), Number(offset) + Number(limit));

    res.json({ list, pageInfo: { totalRows: total } });
  } catch (err) {
    console.error('[leads] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = await n8n.updateLead(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    console.error('[leads] update error:', err.message);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

module.exports = router;
