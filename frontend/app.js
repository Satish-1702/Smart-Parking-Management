const API_BASE = "http://localhost:8000";
const LOT_ID = "central-lot";

const gridEl = document.getElementById("grid");
const slotInfoEl = document.getElementById("slot-info");
const priceInfoEl = document.getElementById("price-info");
const refreshBtn = document.getElementById("refresh-btn");

let slots = [];

function statusClass(status) {
  if (status === 0) return "vacant";
  if (status === 1) return "occupied";
  return "blocked";
}

function renderGrid() {
  gridEl.innerHTML = "";
  slots.forEach((slot) => {
    const div = document.createElement("div");
    div.className = `slot ${statusClass(slot.status)}`;
    div.title = `${slot.id} (${slot.type})`;
    div.textContent = slot.id.replace("S-", "");
    div.onclick = () => showSlot(slot.id);
    gridEl.appendChild(div);
  });
}

function showSlot(slotId) {
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return;
  slotInfoEl.textContent = JSON.stringify(slot, null, 2);
}

async function fetchGrid() {
  const res = await fetch(`${API_BASE}/lots/${LOT_ID}/slots`);
  const data = await res.json();
  slots = data.slots;
  renderGrid();
  showSlot(slots[0]?.id);
}

async function fetchPrices() {
  const res = await fetch(`${API_BASE}/pricing/current`);
  const data = await res.json();
  priceInfoEl.textContent = JSON.stringify(data.prices, null, 2);
}

async function runScenario(type) {
  await fetch(`${API_BASE}/scenarios/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, intensity: 0.6 }),
  });
}

function setupActions() {
  document.querySelectorAll("button[data-scenario]").forEach((btn) => {
    btn.onclick = () => runScenario(btn.dataset.scenario);
  });
  refreshBtn.onclick = () => {
    fetchGrid();
    fetchPrices();
  };
}

function setupWebsocket() {
  const ws = new WebSocket(`ws://localhost:8000/ws/stream`);
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "init") {
      slots = msg.data.slots;
      renderGrid();
    }
    if (msg.type === "slot.updated") {
      const idx = slots.findIndex((s) => s.id === msg.slot.id);
      if (idx >= 0) {
        slots[idx] = msg.slot;
        renderGrid();
        showSlot(msg.slot.id);
      }
    }
  };
}

setupActions();
fetchGrid();
fetchPrices();
setupWebsocket();

