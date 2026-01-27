import cors from "cors";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

import { connectDb } from "./db.js";
import { SlotModel } from "./models/slot.js";
import { computePrices } from "./pricing.js";
import { runScenario } from "./scenarios.js";
import { grid } from "./state.js";

const app = express();
app.use(cors());
app.use(express.json());

const ready = (async () => {
  await connectDb();
  await grid.loadFromModel(SlotModel);
})();

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/lots/:lotId/slots", async (req, res) => {
  await ready;
  if (req.params.lotId !== grid.lotId) return res.status(404).json({ error: "lot not found" });
  res.json(grid.snapshot());
});

app.patch("/slots/:slotId", async (req, res) => {
  await ready;
  const { status, price } = req.body;
  if (status === undefined) return res.status(400).json({ error: "status required" });
  try {
    const slot = grid.setStatus(req.params.slotId, Number(status), price);
    await grid.persistSlot(SlotModel, slot);
    broadcast({ type: "slot.updated", slot: slot.toJSON() });
    return res.json(slot.toJSON());
  } catch (err) {
    return res.status(404).json({ error: "slot not found" });
  }
});

app.post("/scenarios/run", async (req, res) => {
  await ready;
  const { type, intensity = 0.5 } = req.body || {};
  const result = runScenario(grid, type, intensity);
  if (result.status !== "ok") return res.status(400).json({ error: "unknown scenario" });
  const statusValue = type === "emergency" ? 2 : 1;
  const updated = grid.bulkUpdate(result.updated, statusValue);
  await grid.persistBulk(SlotModel, updated);
  updated.forEach((slot) => broadcast({ type: "slot.updated", slot: slot.toJSON() }));
  res.json({ applied: updated.map((s) => s.id), mode: result.mode });
});

app.get("/pricing/current", (_req, res) => {
  const prices = computePrices(grid);
  res.json({ prices });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/stream" });
const clients = new Set();

wss.on("connection", async (ws) => {
  await ready;
  clients.add(ws);
  ws.send(JSON.stringify({ type: "init", data: grid.snapshot() }));
  ws.on("message", () => {});
  ws.on("close", () => clients.delete(ws));
});

function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  });
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

