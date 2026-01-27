# Digital Twin Smart Parking (prototype)

Two backends are included so you can pick your stack:
- **Node.js / Express + WebSocket** (`server/`)
- **FastAPI + WebSocket** (`backend/`)

Static frontend (`frontend/`) is plain HTML/CSS/JS and talks to `http://localhost:8000`.

## Quick start
### Option A: Node.js / Express
```bash
cd server
npm install
npm run start   # expects MongoDB running (local or Atlas). Set MONGODB_URI if needed.
npm run dev     # optional: live reload
```

### Option B: FastAPI
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
Serve the static files:
```bash
cd frontend
python -m http.server 4173
```
Open http://localhost:4173 in your browser. The page expects the backend at http://localhost:8000.

### React Frontend (interactive controls)
A no-build React bundle is under `frontend-react/` (uses React via CDN).
```bash
cd frontend-react
python -m http.server 4174
```
Open http://localhost:4174 (talks to http://localhost:8000).

### MongoDB / Firebase notes
- Node backend persists slots to MongoDB via `MONGODB_URI` (default: `mongodb://localhost:27017/smart-parking`). Use MongoDB Atlas for cloud or point to a local daemon.
- Firebase alternative: replace `server/src/db.js` + `server/src/models/slot.js` with Firestore calls, then call `grid.loadFromModel` / `grid.persistSlot` analogs to hydrate and sync state.

## What’s included
- Endpoints for slots, scenarios, pricing, and a websocket stream (Node and Python versions).
- In-memory grid seeded with sample slots (`server/src/state.js`, `backend/app/state.py`).
- Simple dynamic pricing (`server/src/pricing.js`, `backend/app/pricing.py`).
- Scenario runner for rush/festival/emergency (`server/src/scenarios.js`, `backend/app/scenarios.py`).
- Static UI showing the grid, slot details, and prices (`frontend/`).
- React UI with live websocket updates and slot controls (`frontend-react/`).

## Notes
- State is in-memory only; restart resets data. Swap the grid store with MongoDB or Firebase by persisting slot objects and pushing updates through the websocket.
- CORS is open for local development.
- Extend pricing/scenario logic or plug in auth as needed.

"# Smart-Parking-Management" 
