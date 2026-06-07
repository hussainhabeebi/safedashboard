const axios = require('axios');

function client() {
  return axios.create({
    baseURL: process.env.NOCODB_API_URL,
    headers: { 'xc-token': process.env.NOCODB_API_TOKEN },
  });
}

const BASE    = () => process.env.NOCODB_BASE_ID;
const LEADS   = () => process.env.NOCODB_LEADS_TABLE_ID;
const CONFIG  = () => process.env.NOCODB_CONFIG_TABLE_ID;

async function getLeads({ filter, sort, search, limit = 50, offset = 0 } = {}) {
  const params = { limit, offset };
  const whereParts = [];

  if (filter && filter !== 'all') {
    whereParts.push(`(Status,eq,${filter})`);
  }
  if (search) {
    whereParts.push(`(Name,like,%${search}%)~or(Phone,like,%${search}%)`);
  }
  if (whereParts.length) {
    params.where = whereParts.join('~and');
  }
  if (sort) {
    params.sort = sort;
  } else {
    params.sort = '-CreatedAt';
  }

  const res = await client().get(
    `/api/v1/db/data/noco/${BASE()}/${LEADS()}`,
    { params }
  );
  return res.data;
}

async function updateLead(id, data) {
  const res = await client().patch(
    `/api/v1/db/data/noco/${BASE()}/${LEADS()}/${id}`,
    data
  );
  return res.data;
}

async function getTodayStats() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const res = await client().get(
      `/api/v1/db/data/noco/${BASE()}/${LEADS()}/count`,
      { params: { where: `(CreatedAt,gte,${today})` } }
    );
    return { newLeadsToday: res.data.count ?? 0 };
  } catch {
    const res = await client().get(
      `/api/v1/db/data/noco/${BASE()}/${LEADS()}`,
      { params: { where: `(CreatedAt,gte,${today})`, limit: 1000 } }
    );
    const rows = res.data?.list ?? res.data?.records ?? [];
    return { newLeadsToday: rows.length };
  }
}

async function getLeadsAnalytics() {
  // Fetch up to 1000 leads for client-side aggregation
  const res = await client().get(
    `/api/v1/db/data/noco/${BASE()}/${LEADS()}`,
    { params: { limit: 1000, sort: '-CreatedAt' } }
  );
  const rows = res.data?.list ?? res.data?.records ?? [];

  // By status
  const byStatus = {};
  for (const r of rows) {
    const s = r.Status || r.status || 'Unknown';
    byStatus[s] = (byStatus[s] || 0) + 1;
  }

  // By interest/insurance type
  const byInterest = {};
  for (const r of rows) {
    const interest = r.Interest || r.interest || r.InsuranceType || r.insurance_type || 'Unknown';
    byInterest[interest] = (byInterest[interest] || 0) + 1;
  }

  // By language
  const byLanguage = {};
  for (const r of rows) {
    const lang = r.Language || r.language || 'Unknown';
    byLanguage[lang] = (byLanguage[lang] || 0) + 1;
  }

  // Leads per day for last 30 days
  const now = new Date();
  const byDate = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    byDate[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of rows) {
    const createdAt = r.CreatedAt || r.created_at || r.createdAt;
    if (!createdAt) continue;
    const d = new Date(createdAt).toISOString().slice(0, 10);
    if (d in byDate) byDate[d]++;
  }

  // Last 7 days for dashboard
  const last7Days = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7Days[key] = byDate[key] ?? 0;
  }

  return { byStatus, byInterest, byLanguage, byDate, last7Days, total: rows.length };
}

async function getConfig() {
  const res = await client().get(
    `/api/v1/db/data/noco/${BASE()}/${CONFIG()}`,
    { params: { limit: 1 } }
  );
  const rows = res.data?.list ?? res.data?.records ?? [];
  return rows[0] ?? {};
}

async function updateConfig(data) {
  const config = await getConfig();
  const id = config.Id || config.id;
  if (!id) {
    const res = await client().post(
      `/api/v1/db/data/noco/${BASE()}/${CONFIG()}`,
      data
    );
    return res.data;
  }
  const res = await client().patch(
    `/api/v1/db/data/noco/${BASE()}/${CONFIG()}/${id}`,
    data
  );
  return res.data;
}

module.exports = { getLeads, updateLead, getTodayStats, getLeadsAnalytics, getConfig, updateConfig };
