from __future__ import annotations

import asyncio
from typing import List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .pricing import compute_prices
from .scenarios import run_scenario
from .state import Slot, grid

app = FastAPI(title="Digital Twin Smart Parking")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SlotPatch(BaseModel):
    status: int
    price: Optional[float] = None


class ScenarioRequest(BaseModel):
    type: str
    intensity: float = 0.5


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active:
                self.active.remove(websocket)

    async def broadcast(self, message: dict):
        dead: List[WebSocket] = []
        async with self._lock:
            for ws in self.active:
                try:
                    await ws.send_json(message)
                except WebSocketDisconnect:
                    dead.append(ws)
            for ws in dead:
                if ws in self.active:
                    self.active.remove(ws)


manager = ConnectionManager()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/lots/{lot_id}/slots")
async def list_slots(lot_id: str):
    if lot_id != grid.lot_id:
        raise HTTPException(status_code=404, detail="lot not found")
    return grid.snapshot()


@app.patch("/slots/{slot_id}")
async def update_slot(slot_id: str, patch: SlotPatch):
    try:
        slot: Slot = await grid.set_status(slot_id, patch.status, patch.price)
    except KeyError:
        raise HTTPException(status_code=404, detail="slot not found")
    await manager.broadcast({"type": "slot.updated", "slot": slot.to_dict()})
    return slot.to_dict()


@app.post("/scenarios/run")
async def scenario(req: ScenarioRequest):
    result = run_scenario(grid, req.type, req.intensity)
    if result.get("status") != "ok":
        raise HTTPException(status_code=400, detail="unknown scenario")
    status_value = 1 if req.type in {"rush", "festival"} else 2
    updated_slots = await grid.bulk_update(result["updated"], status=status_value)
    for slot in updated_slots:
        await manager.broadcast({"type": "slot.updated", "slot": slot.to_dict()})
    return {"applied": [s.id for s in updated_slots], "mode": result["mode"]}


@app.get("/pricing/current")
async def current_prices():
    prices = compute_prices(grid)
    return {"prices": prices}


@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    await websocket.send_json({"type": "init", "data": grid.snapshot()})
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)

