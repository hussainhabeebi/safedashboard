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
  const params = {
    where: `(CreatedAt,gte,${today})`,
    limit: 1,
    count: true,
  };
  try {
    const res = await client().get(
      `/api/v1/db/data/noco/${BASE()}/${LEADS()}/count`,
      { params: { where: `(CreatedAt,gte,${today})` } }
    );
    return { newLeadsToday: res.data.count ?? 0 };
  } catch {
    // Fallback: fetch all and count
    const res = await client().get(
      `/api/v1/db/data/noco/${BASE()}/${LEADS()}`,
      { params: { where: `(CreatedAt,gte,${today})`, limit: 1000 } }
    );
    const rows = res.data?.list ?? res.data?.records ?? [];
    return { newLeadsToday: rows.length };
  }
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
  // Get first row ID then patch it
  const config = await getConfig();
  const id = config.Id || config.id;
  if (!id) {
    // Create if doesn't exist
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

module.exports = { getLeads, updateLead, getTodayStats, getConfig, updateConfig };
