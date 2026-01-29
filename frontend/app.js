const API_BASE = "http://localhost:8000";
const LOT_ID = "central-lot";

const gridEl = document.getElementById("grid");
const slotInfoEl = document.getElementById("slot-info");
const slotSubtitleEl = document.getElementById("slot-subtitle");
const priceInfoEl = document.getElementById("price-info");
const refreshBtn = document.getElementById("refresh-btn");
const analyticsBtn = document.getElementById("analytics-btn");
const totalCountEl = document.getElementById("total-count");
const vacantCountEl = document.getElementById("vacant-count");
const occupiedCountEl = document.getElementById("occupied-count");
const blockedCountEl = document.getElementById("blocked-count");
const slotStatusSelectEl = document.getElementById("slot-status-select");
const slotPriceInputEl = document.getElementById("slot-price-input");
const slotSaveBtnEl = document.getElementById("slot-save-btn");

let slots = [];
let selectedSlotId = null;
let lastSummaryCounts = { total: 0, vacant: 0, occupied: 0, blocked: 0 };

function statusClass(status) {
  if (status === 0) return "vacant";
  if (status === 1) return "occupied";
  return "blocked";
}

function renderGrid() {
  if (!gridEl) return;
  gridEl.innerHTML = "";
  slots.forEach((slot) => {
    const div = document.createElement("div");
    div.className = `slot ${statusClass(slot.status)}`;
    div.title = `${slot.id} (${slot.type})`;
    div.textContent = slot.id.replace("S-", "");
    div.dataset.slotId = slot.id;
    if (slot.id === selectedSlotId) {
      div.classList.add("selected");
    }
    div.onclick = () => showSlot(slot.id);
    gridEl.appendChild(div);
  });
}

function showSlot(slotId) {
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return;
  selectedSlotId = slotId;

  const statusLabel =
    slot.status === 0 ? "Vacant" : slot.status === 1 ? "Occupied" : "Unavailable";

  const detailsLines = [
    `ID:       ${slot.id}`,
    `Type:     ${slot.type}`,
    `Status:   ${statusLabel}`,
    slot.price != null ? `Price:   ₹${slot.price.toFixed(2)} / hour` : "",
  ].filter(Boolean);

  if (slotInfoEl) {
    slotInfoEl.textContent = detailsLines.join("\n");
  }
  if (slotSubtitleEl) {
    slotSubtitleEl.textContent = `Currently viewing ${slot.id} (${statusLabel.toLowerCase()}).`;
  }
  if (slotStatusSelectEl) {
    slotStatusSelectEl.value = String(slot.status);
  }
  if (slotPriceInputEl) {
    slotPriceInputEl.value =
      slot.price != null && !Number.isNaN(slot.price) ? String(slot.price) : "";
  }

  // Update selected state on grid
  document.querySelectorAll("#grid .slot").forEach((el) => {
    if (el.dataset.slotId === selectedSlotId) {
      el.classList.add("selected");
    } else {
      el.classList.remove("selected");
    }
  });
}

async function fetchGrid() {
  const res = await fetch(`${API_BASE}/lots/${LOT_ID}/slots`);
  const data = await res.json();
  slots = data.slots || [];
  updateSummary();
  renderGrid();
  if (slots[0]) {
    showSlot(slots[0].id);
  } else if (slotInfoEl) {
    slotInfoEl.textContent = "No slots available for this lot.";
  }
  updateInsights();
}

function updateInsights() {
  if (!priceInfoEl) return;
  if (!slots.length) {
    priceInfoEl.textContent =
      "No live data yet.\nRun Refresh or a scenario to see insights.";
    return;
  }

  const total = slots.length;
  const vacant = slots.filter((s) => s.status === 0).length;
  const occupied = slots.filter((s) => s.status === 1).length;
  const blocked = slots.filter((s) => s.status === 2).length;
  const utilisation = total ? Math.round((occupied / total) * 100) : 0;

  let statusLine = "Traffic level: ";
  if (utilisation < 40) statusLine += "Calm (plenty of free slots)";
  else if (utilisation < 75) statusLine += "Moderate (balanced usage)";
  else statusLine += "High (near capacity)";

  const lines = [
    `Total slots:      ${total}`,
    `Vacant:           ${vacant}`,
    `Occupied:         ${occupied}`,
    `Unavailable:      ${blocked}`,
    "",
    `Utilisation:      ${utilisation}%`,
    statusLine,
    "",
    vacant > 0
      ? "Suggestion: You can safely allocate more arrivals."
      : "Suggestion: Lot is full or blocked. Consider redirecting vehicles.",
  ];

  priceInfoEl.textContent = lines.join("\n");
}

function updateSummary() {
  if (!totalCountEl) return;
  const total = slots.length;
  const vacant = slots.filter((s) => s.status === 0).length;
  const occupied = slots.filter((s) => s.status === 1).length;
  const blocked = slots.filter((s) => s.status === 2).length;

  totalCountEl.textContent = total;
  vacantCountEl.textContent = vacant;
  occupiedCountEl.textContent = occupied;
  blockedCountEl.textContent = blocked;

  lastSummaryCounts = { total, vacant, occupied, blocked };
}

function buildAnalyticsQuery(feature, extraParams = {}) {
  const params = new URLSearchParams({
    feature: feature || "total",
    total: String(lastSummaryCounts.total),
    vacant: String(lastSummaryCounts.vacant),
    occupied: String(lastSummaryCounts.occupied),
    blocked: String(lastSummaryCounts.blocked),
    ...extraParams,
  });
  return params.toString();
}

function openAnalyticsFromDashboard(feature, extraParams = {}) {
  const query = buildAnalyticsQuery(feature, extraParams);
  return `analytics.html?${query}`;
}

function setupFeatureLinks() {
  document.querySelectorAll(".feature-card").forEach((card) => {
    card.style.cursor = "pointer";
    card.onclick = () => {
      const feature = card.dataset.feature || "total";
      openAnalyticsFromDashboard(feature);
    };
  });
}

async function runScenario(type) {
  const res = await fetch(`${API_BASE}/scenarios/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, intensity: 0.6 }),
  });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function setupActions() {
  if (!refreshBtn) return;
  document.querySelectorAll("button[data-scenario]").forEach((btn) => {
    btn.onclick = async () => {
      const type = btn.dataset.scenario;
      await runScenario(type);
      // Immediately refresh grid and pricing so colors and counts update
      await fetchGrid();
      // Navigate to a dedicated scenario page in the same tab with context
      const query = buildAnalyticsQuery(type, { scenario: type });
      let target = "analytics.html";
      if (type === "rush") target = "rush-view.html";
      else if (type === "festival") target = "festival-view.html";
      else if (type === "emergency") target = "emergency-view.html";
      window.location.href = `${target}?${query}`;
    };
  });
  refreshBtn.onclick = () => {
    fetchGrid();
  };

  if (analyticsBtn) {
    analyticsBtn.onclick = () => {
      // Open generic analytics in the SAME tab (no new tab)
      window.location.href = openAnalyticsFromDashboard("total");
    };
  }

  if (slotSaveBtnEl) {
    slotSaveBtnEl.onclick = async () => {
      if (!selectedSlotId) {
        alert("Please select a slot in the layout first.");
        return;
      }
      const statusValue = Number(slotStatusSelectEl?.value ?? 0);
      const priceRaw = slotPriceInputEl?.value.trim();
      const price =
        priceRaw === "" || Number.isNaN(Number(priceRaw))
          ? undefined
          : Number(priceRaw);

      try {
        await fetch(`${API_BASE}/slots/${selectedSlotId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            price === undefined ? { status: statusValue } : { status: statusValue, price },
          ),
        });
        await fetchGrid();
        alert(`Slot ${selectedSlotId} updated successfully.`);
      } catch (err) {
        console.error(err);
        alert("Failed to update slot. Please try again.");
      }
    };
  }
}

function setupWebsocket() {
  const ws = new WebSocket(`ws://localhost:8000/ws/stream`);
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "init") {
      slots = msg.data.slots;
      updateSummary();
      renderGrid();
    }
    if (msg.type === "slot.updated") {
      const idx = slots.findIndex((s) => s.id === msg.slot.id);
      if (idx >= 0) {
        slots[idx] = msg.slot;
        updateSummary();
        renderGrid();
        showSlot(msg.slot.id);
      }
    }
  };
}

if (gridEl && slotInfoEl && priceInfoEl) {
  setupActions();
  setupFeatureLinks();
  fetchGrid();
  setupWebsocket();
}

