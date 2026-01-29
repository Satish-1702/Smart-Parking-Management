const layoutState = {
  initialized: false,
  states: [], // "vacant" | "occupied" | "blocked"
};

function getParams() {
  const search = new URLSearchParams(window.location.search);
  const toInt = (key) => parseInt(search.get(key) || "0", 10) || 0;
  return {
    feature: search.get("feature") || "total",
    scenario: search.get("scenario") || "",
    total: toInt("total"),
    vacant: toInt("vacant"),
    occupied: toInt("occupied"),
    blocked: toInt("blocked"),
  };
}

function countsFromStates(states) {
  const result = { total: states.length, vacant: 0, occupied: 0, blocked: 0 };
  states.forEach((s) => {
    if (s === "vacant") result.vacant++;
    else if (s === "occupied") result.occupied++;
    else result.blocked++;
  });
  return result;
}

function renderScenarioView() {
  const params = getParams();
  let { feature, scenario, total, vacant, occupied, blocked } = params;
  const barsEl = document.getElementById("bars");
  const subtitleEl = document.getElementById("analytics-subtitle");
  const pieTotalEl = document.getElementById("pie-total");
  const pieFeatureEl = document.getElementById("pie-feature");
  const layoutGridEl = document.getElementById("layout-grid");

  let safeTotal = total || vacant + occupied + blocked || 1;

  // Initialise layout state once from incoming counts
  if (!layoutState.initialized) {
    const totalSlots = Math.max(safeTotal, 20);
    const states = [];
    let remainingVacant = vacant;
    let remainingOccupied = occupied;
    let remainingBlocked = blocked;
    for (let i = 0; i < totalSlots; i++) {
      let cls = "blocked";
      if (remainingVacant > 0) {
        cls = "vacant";
        remainingVacant--;
      } else if (remainingOccupied > 0) {
        cls = "occupied";
        remainingOccupied--;
      } else if (remainingBlocked > 0) {
        cls = "blocked";
        remainingBlocked--;
      } else {
        cls = "vacant"; // any extra become vacant, so user can allocate
      }
      states.push(cls);
    }
    layoutState.states = states;
    layoutState.initialized = true;
  }

  // Recompute counts from the current layout state so clicks update bars
  if (layoutState.states.length) {
    const c = countsFromStates(layoutState.states);
    total = c.total;
    vacant = c.vacant;
    occupied = c.occupied;
    blocked = c.blocked;
    safeTotal = total || 1;
  }

  if (subtitleEl) {
    const scenarioLabel =
      scenario === "rush"
        ? "Rush hour demand pattern applied."
        : scenario === "festival"
        ? "Festival event traffic applied."
        : scenario === "emergency"
        ? "Emergency response mode applied."
        : "";
    subtitleEl.textContent =
      scenarioLabel || subtitleEl.textContent || "Scenario analytics overview.";
  }

  if (pieTotalEl) {
    pieTotalEl.textContent = `${safeTotal} slots`;
  }
  if (pieFeatureEl) {
    const featureLabel = {
      total: "All slots",
      vacant: "Vacant-focused view",
      occupied: "Occupied-focused view",
      blocked: "Unavailable-focused view",
    }[feature];
    pieFeatureEl.textContent = featureLabel || "";
  }

  const rows = [
    { key: "vacant", label: "Vacant", value: vacant },
    { key: "occupied", label: "Occupied", value: occupied },
    { key: "blocked", label: "Unavailable", value: blocked },
  ];

  if (barsEl) {
    barsEl.innerHTML = "";
    rows.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "bar-row";

      const labelEl = document.createElement("div");
      labelEl.className = "bar-label";
      labelEl.textContent = row.label;

      const trackEl = document.createElement("div");
      trackEl.className = "bar-track";

      const fillEl = document.createElement("div");
      fillEl.className = `bar-fill ${row.key}`;
      const pct = Math.round((row.value / safeTotal) * 100);
      fillEl.style.width = `${pct}%`;

      const valueEl = document.createElement("div");
      valueEl.className = "bar-value";
      valueEl.textContent = row.value;

      trackEl.appendChild(fillEl);
      rowEl.appendChild(labelEl);
      rowEl.appendChild(trackEl);
      rowEl.appendChild(valueEl);
      barsEl.appendChild(rowEl);
    });
  }

  if (layoutGridEl) {
    layoutGridEl.innerHTML = "";
    const totalSlots = layoutState.states.length || Math.max(safeTotal, 20);

    for (let i = 0; i < totalSlots; i++) {
      const cell = document.createElement("div");
      cell.className = "layout-slot";
      const state = layoutState.states[i] || "vacant";
      cell.classList.add(state);
      cell.textContent = i + 1;
      cell.title = `Slot ${i + 1} (${state})`;

      cell.onclick = () => {
        // Cycle through vacant -> occupied -> blocked -> vacant
        const current = layoutState.states[i] || "vacant";
        const next =
          current === "vacant"
            ? "occupied"
            : current === "occupied"
            ? "blocked"
            : "vacant";
        layoutState.states[i] = next;
        renderScenarioView();
      };

      layoutGridEl.appendChild(cell);
    }
  }
}

document.addEventListener("DOMContentLoaded", renderScenarioView);

