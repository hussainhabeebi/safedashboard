const axios = require('axios');

const BASE = 'https://graph.facebook.com/v21.0';
const PHONE_ID = () => process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = () => process.env.WHATSAPP_API_TOKEN;
const WABA_ID = () => process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

function client() {
  return axios.create({
    baseURL: BASE,
    headers: { Authorization: `Bearer ${TOKEN()}` },
  });
}

// Get all templates
async function getTemplates() {
  const res = await client().get(`/${WABA_ID()}/message_templates`, {
    params: { limit: 100 },
  });
  return res.data;
}

// Send a template message to a phone number
async function sendTemplate(to, templateName, languageCode = 'en_US', components = []) {
  // Normalize phone: ensure it starts with country code, no +
  const phone = to.replace(/\D/g, '').replace(/^0+/, '');
  const res = await client().post(`/${PHONE_ID()}/messages`, {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  });
  return res.data;
}

// Send a bulk template to multiple phone numbers
async function sendBulkTemplate(phones, templateName, languageCode = 'en_US', components = []) {
  const results = [];
  for (const phone of phones) {
    try {
      const r = await sendTemplate(phone, templateName, languageCode, components);
      results.push({ phone, status: 'sent', messageId: r.messages?.[0]?.id });
    } catch (err) {
      results.push({ phone, status: 'failed', error: err.response?.data?.error?.message || err.message });
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

// Create a new message template
async function createTemplate(name, category, language, components) {
  const res = await client().post(`/${WABA_ID()}/message_templates`, {
    name,
    category,
    language,
    components,
  });
  return res.data;
}

module.exports = { getTemplates, sendTemplate, sendBulkTemplate, createTemplate };
