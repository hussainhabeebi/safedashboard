# Safe Assets Dashboard

Secure full-stack dashboard for Safe Assets Insurance (Rasi, Kollam, Kerala).

**Stack:** Node.js + Express (backend) · React + Vite (frontend) · Docker

---

## First-Time Setup

### 1. Generate a bcrypt password hash

Install bcryptjs once, then run:

```bash
node -e "require('bcryptjs').hash('YourChosenPassword', 12).then(h => console.log(h))"
```

Copy the output (starts with `$2b$12$...`) into `.env` as `ADMIN_PASSWORD_HASH`.

### 2. Generate a JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the 64-character hex string into `.env` as `JWT_SECRET`.

### 3. Create .env file

```bash
cp .env.example .env
# Edit .env and fill in all values
```

---

## DNS Setup

Add an **A record** in your domain registrar / DNS provider:

| Type | Name      | Value           | TTL |
|------|-----------|-----------------|-----|
| A    | dashboard | 156.67.110.188  | 300 |

This points `dashboard.safeassetsofficial.com` → your VPS.

Wait 5–30 minutes for DNS propagation.

---

## Coolify Deployment (VPS: 156.67.110.188)

1. **Log in** to your Coolify instance on the VPS.

2. **New Resource** → **Docker Compose** → paste the contents of `docker-compose.yml`.

3. **Environment Variables** — add each variable from `.env.example` with your real values.

4. **Domain** → set `dashboard.safeassetsofficial.com`

5. **Enable HTTPS** — Coolify will auto-provision a Let's Encrypt certificate.

6. **Deploy** — Coolify builds the image and starts the container.

7. Verify: open `https://dashboard.safeassetsofficial.com/login`

---

## Local Development

### Backend

```bash
# In project root
npm install
cp .env.example .env   # fill in values
npm run dev            # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173 (proxies /api → :4000)
```

### Full build (production test)

```bash
cd frontend && npm run build && cd ..
npm start
# Visit http://localhost:4000
```

### Docker build

```bash
docker compose up --build
```

---

## NocoDB Tables

The app expects two tables. Suggested column names (match exactly):

**Leads table** (`NOCODB_LEADS_TABLE_ID`):
- `Name` (text)
- `Phone` (text)
- `Interest` (text) — insurance type
- `Status` (text) — New / Warm / Quoted / Closed / Not Interested
- `Stage` (text)
- `Language` (text)
- `Notes` (long text)
- `detected_state` (text)
- `CreatedAt` (datetime, auto)
- `UpdatedAt` (datetime, auto)

**Config table** (`NOCODB_CONFIG_TABLE_ID`):
- `system_prompt` (long text)
- `bot_enabled` (checkbox/boolean)
- `default_language` (text)

---

## Security Notes

- Login is rate-limited: 5 attempts per 15 minutes, then HTTP 429
- JWT stored in httpOnly cookie — not accessible to JavaScript
- Password never stored in plain text — bcrypt hash only
- All API routes require valid JWT — middleware enforced server-side
- CORS locked to `dashboard.safeassetsofficial.com`
- Helmet.js sets: HSTS, X-Frame-Options DENY, CSP, X-Content-Type-Options
- Error responses never expose stack traces or internal details
- Login error message is always generic ("Invalid credentials") regardless of which field is wrong

---

## Resetting the Password

Generate a new bcrypt hash and update `ADMIN_PASSWORD_HASH` in `.env`, then restart the container:

```bash
docker compose restart
```

---

## Support

For issues, contact the developer directly. Do not share `.env` or credentials with anyone.
