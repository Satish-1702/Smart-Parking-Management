import cors from "cors";
import express from "express";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

import { connectDb } from "./db.js";
import { SlotModel } from "./models/slot.js";
import { computePrices } from "./pricing.js";
import { runScenario } from "./scenarios.js";
import { grid } from "./state.js";
import placesRouter from "./routes/places.js";
import bookingsRouter from "./routes/bookings.js";
import usersRouter from "./routes/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../../frontend");

const app = express();
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use(
  cors(
    configuredOrigins.length
      ? { origin: configuredOrigins }
      : {
          origin: true,
        }
  )
);
app.use(express.json({ limit: "1mb" }));
app.use(express.static(frontendPath));
app.use("/api", placesRouter);
app.use("/api", bookingsRouter);
app.use("/api", usersRouter);

const ready = (async () => {
  await connectDb();
  await grid.loadFromModel(SlotModel);
})();

app.get("/health", (_req, res) =>
  res.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
);
app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
);

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
  ws.isAlive = true;
  clients.add(ws);
  ws.send(JSON.stringify({ type: "init", data: grid.snapshot() }));
  ws.on("pong", () => {
    ws.isAlive = true;
  });
  ws.on("message", () => {});
  ws.on("close", () => clients.delete(ws));
});

// Keep socket state fresh and clean up stale connections.
const wsHeartbeat = setInterval(() => {
  clients.forEach((ws) => {
    if (ws.isAlive === false) {
      clients.delete(ws);
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}`);
});

server.on("error", (err) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});

server.on("close", () => {
  clearInterval(wsHeartbeat);
});

