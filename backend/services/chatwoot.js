const axios = require('axios');

function client() {
  return axios.create({
    baseURL: process.env.CHATWOOT_API_URL,
    headers: { 'api_access_token': process.env.CHATWOOT_API_TOKEN },
  });
}

const ACCOUNT = () => process.env.CHATWOOT_ACCOUNT_ID || '10';

async function getConversations() {
  const all = [];
  let page = 1;
  while (true) {
    const res = await client().get(
      `/api/v1/accounts/${ACCOUNT()}/conversations`,
      { params: { page } }
    );
    const payload = res.data?.data?.payload ?? res.data?.payload ?? [];
    const items = Array.isArray(payload) ? payload : [];
    if (items.length === 0) break;
    all.push(...items);
    // Chatwoot returns 25 per page; if less than 25, we've hit the end
    if (items.length < 25) break;
    page++;
    // Safety cap
    if (page > 100) break;
  }
  return { payload: all };
}

async function getMessages(conversationId) {
  const res = await client().get(
    `/api/v1/accounts/${ACCOUNT()}/conversations/${conversationId}/messages`
  );
  // Chatwoot may return { payload: [...] } or { data: { payload: [...] } }
  const raw = res.data;
  const msgs = raw?.payload ?? raw?.data?.payload ?? raw ?? [];
  return { payload: Array.isArray(msgs) ? msgs : [] };
}

async function sendMessage(conversationId, content) {
  const res = await client().post(
    `/api/v1/accounts/${ACCOUNT()}/conversations/${conversationId}/messages`,
    { content, message_type: 'outgoing', private: false }
  );
  // Return the message object directly so frontend can replace the temp message
  const payload = res.data?.payload ?? res.data;
  return { payload: Array.isArray(payload) ? payload[0] : payload };
}

async function assignToAgent(conversationId) {
  const [assignRes] = await Promise.all([
    client().post(
      `/api/v1/accounts/${ACCOUNT()}/conversations/${conversationId}/assignments`,
      { assignee_id: null }
    ),
    client().patch(
      `/api/v1/accounts/${ACCOUNT()}/conversations/${conversationId}`,
      { status: 'open' }
    ),
  ]);
  return { ok: true, data: assignRes.data };
}

async function getContacts(page = 1, search = '') {
  const params = { page };
  if (search) params.q = search;
  const res = await client().get(
    `/api/v1/accounts/${ACCOUNT()}/contacts`,
    { params }
  );
  return res.data;
}

async function getContactConversations(contactId) {
  const res = await client().get(
    `/api/v1/accounts/${ACCOUNT()}/contacts/${contactId}/conversations`
  );
  return res.data;
}

async function getTodayStats() {
  try {
    const allConvos = await getConversations();
    const convos = allConvos.payload ?? [];
    const today = new Date().toISOString().slice(0, 10);

    let openConversations = 0;
    let resolvedConversations = 0;
    let pendingConversations = 0;
    let handoversToday = 0;
    let botRepliesToday = 0;

    for (const c of convos) {
      if (c.status === 'open') openConversations++;
      else if (c.status === 'resolved') resolvedConversations++;
      else if (c.status === 'pending') pendingConversations++;

      const updatedAt = c.last_activity_at
        ? new Date(c.last_activity_at * 1000).toISOString().slice(0, 10)
        : null;

      if (updatedAt === today) {
        if (c.meta?.assignee) handoversToday++;
        if (!c.meta?.assignee) botRepliesToday++;
      }
    }

    return {
      openConversations,
      resolvedConversations,
      pendingConversations,
      handoversToday,
      botRepliesToday,
      conversationsByStatus: { open: openConversations, resolved: resolvedConversations, pending: pendingConversations },
    };
  } catch {
    return {
      openConversations: 0, resolvedConversations: 0, pendingConversations: 0,
      handoversToday: 0, botRepliesToday: 0,
      conversationsByStatus: { open: 0, resolved: 0, pending: 0 },
    };
  }
}

module.exports = { getConversations, getMessages, sendMessage, assignToAgent, getContacts, getContactConversations, getTodayStats };
