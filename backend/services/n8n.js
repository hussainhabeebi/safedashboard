const axios = require('axios');

function client() {
  const base = (process.env.N8N_WEBHOOK_BASE_URL || '').replace(/\/$/, '');
  return axios.create({ baseURL: base + '/webhook', timeout: 30000 });
}

// ── Conversations ─────────────────────────────────────────────────────────────

async function getConversations() {
  const res = await client().get('/safeassets/poPpDqgxgpRQtAXohgxNm4Pd/conversations');
  return Array.isArray(res.data) ? res.data : [];
}

async function getMessages(convId) {
  const rawId = String(convId).replace(/^C-/, '');
  const res = await client().post('/safeassets/cW1mEsGaKpXn3hJoRt7vZq8Y/conv-messages', { convId: rawId });
  // n8n responds with $json.payload || $json — Chatwoot returns { payload: [...] }
  const data = res.data;
  const msgs = Array.isArray(data) ? data : (data?.payload ?? data ?? []);
  return Array.isArray(msgs) ? msgs : [];
}

async function sendReply(convId, message) {
  const rawId = String(convId).replace(/^C-/, '');
  const res = await client().post('/safeassets/rP2nFuHbLdQk5mViWc6xYz9T/send-reply', { convId: rawId, message });
  return res.data;
}

async function toggleStatus(convId, status = 'resolved') {
  const rawId = String(convId).replace(/^C-/, '');
  const res = await client().post('/safeassets/sT4kGjNpBvRm8wEaZy1xCu3F/toggle-status', { convId: rawId, status });
  return res.data;
}

// ── Leads ─────────────────────────────────────────────────────────────────────

async function getLeads() {
  const res = await client().get('/safeassets/fH9cnX6bchOtZJ9R05uuqarN/leads');
  return Array.isArray(res.data) ? res.data : [];
}

async function updateLead(id, fields) {
  const res = await client().post('/safeassets/TI2Uco896XOqMQpsA7dX83xj/leads/update', { id, fields });
  return res.data;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

async function getAnalytics() {
  const res = await client().get('/safeassets/ZIvXdtJgKHbFL3WeiJPdqVlc/analytics');
  return res.data || {};
}

// ── WhatsApp Templates ────────────────────────────────────────────────────────

async function getTemplates() {
  const res = await client().get('/safeassets/templates/list');
  return Array.isArray(res.data) ? res.data : [];
}

// leads = [{ slno, name, phone, state, degree, is_gulf }]
// vars  = { 1: 'override', 2: 'override' }  (optional)
async function sendBulkTemplate(leads, templateName, language = 'en_US', vars = {}) {
  const res = await client().post('/safeassets/templates/send', {
    leads, templateName, language, vars,
  });
  return res.data;
}

module.exports = { getConversations, getMessages, sendReply, toggleStatus, getLeads, updateLead, getAnalytics, getTemplates, sendBulkTemplate };
