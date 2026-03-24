# Smart Parking Management

Node.js + Express + MongoDB smart parking prototype with:
- Multi-page static frontend in `frontend/`
- REST API + WebSocket backend in `server/`
- Parking place search, booking flow, dashboard, scenario views, and live slot updates

## Project Structure
- `frontend/` UI pages and browser scripts
- `server/src/index.js` API + WebSocket entrypoint
- `server/src/routes/` REST routes (`users`, `places`, `bookings`)
- `server/src/models/` Mongoose models
- `server/src/state.js` in-memory lot state synced with `SlotModel`
- `server/src/scenarios.js` rush/festival/emergency state mutation logic
- `server/src/pricing.js` dynamic pricing calculation
- `server/src/seed.js` seed script for demo admin/user/places/slots

## Local Development
1. Configure env:
```bash
cd server
copy .env.example .env
```
2. Start MongoDB locally (or set Atlas URI in `server/.env`).
3. Install and run backend:
```bash
cd server
npm install
npm run start
```
4. Open UI:
- Option A (recommended): `http://localhost:8000/login.html` (served by Express)
- Option B: serve `frontend/` separately; runtime config auto-targets `localhost:8000` in local dev

## Runtime Configuration
Backend reads env from `server/.env`:
- `MONGODB_URI` (required)
- `PORT` (default `8000`)
- `HOST` (default `0.0.0.0`)
- `CORS_ORIGINS` comma-separated allowlist (optional; if empty, CORS reflects request origin)
- `TRUST_PROXY` (`true`/`false`)
- `MONGODB_TIMEOUT_MS` (default `10000`)

Frontend runtime config (`frontend/runtime-config.js`):
- Defaults to same-origin in deployed environments
- Uses `http://localhost:8000` automatically when frontend is served from another local port
- Optional override from browser:
  - `localStorage.setItem("SP_API_ORIGIN", "https://your-api-domain")`

## Deployment Checklist
1. Provision MongoDB (Atlas or managed instance).
2. Set backend env vars in your hosting platform.
3. Run backend with:
```bash
cd server
npm ci --omit=dev
npm run start
```
4. Serve frontend from the same domain (already handled by Express static middleware).
5. Set `CORS_ORIGINS` if frontend and backend are hosted on different domains.
6. Verify:
   - `GET /health`
   - `GET /api/places`
   - WebSocket at `/ws/stream`

## Docker (Optional)
Build from repository root:
```bash
docker build -f server/Dockerfile -t smart-parking:latest .
docker run --rm -p 8000:8000 --env-file server/.env smart-parking:latest
```

## Security Notes
- Do not commit real secrets in `.env`.
- Rotate any previously exposed credentials.
- Keep `server/.env.example` as the template for shared setup.
