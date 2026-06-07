const axios = require('axios');

function client() {
  return axios.create({
    baseURL: process.env.CHATWOOT_API_URL,
    headers: { 'api_access_token': process.env.CHATWOOT_API_TOKEN },
  });
}

const ACCOUNT = () => process.env.CHATWOOT_ACCOUNT_ID || '10';

async function getConversations() {
  const res = await client().get(
    `/api/v1/accounts/${ACCOUNT()}/conversations`
  );
  return res.data;
}

async function getMessages(conversationId) {
  const res = await client().get(
    `/api/v1/accounts/${ACCOUNT()}/conversations/${conversationId}/messages`
  );
  return res.data;
}

async function assignToAgent(conversationId) {
  // Remove bot assignment and open conversation
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

async function getTodayStats() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await client().get(
      `/api/v1/accounts/${ACCOUNT()}/conversations`,
      { params: { page: 1 } }
    );

    const convos = res.data?.data?.payload ?? res.data?.payload ?? [];

    let openConversations = 0;
    let handoversToday = 0;
    let botRepliesToday = 0;

    for (const c of convos) {
      if (c.status === 'open') openConversations++;

      const updatedAt = c.last_activity_at
        ? new Date(c.last_activity_at * 1000).toISOString().slice(0, 10)
        : null;

      if (updatedAt === today) {
        if (c.meta?.assignee) handoversToday++;
        // Bot replies: conversations updated today without a human assignee
        if (!c.meta?.assignee) botRepliesToday++;
      }
    }

    return { openConversations, handoversToday, botRepliesToday };
  } catch {
    return { openConversations: 0, handoversToday: 0, botRepliesToday: 0 };
  }
}

module.exports = { getConversations, getMessages, assignToAgent, getTodayStats };
