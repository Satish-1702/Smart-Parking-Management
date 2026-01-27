export function runScenario(grid, type, intensity = 0.5) {
  const ids = Array.from(grid.slots.keys());
  const pick = (fraction) => {
    const count = Math.max(1, Math.floor(ids.length * fraction));
    const selected = [...ids].sort(() => 0.5 - Math.random()).slice(0, count);
    return selected;
  };

  if (type === "rush") {
    return { status: "ok", updated: pick(Math.max(0.2, Math.min(intensity, 1.0))), mode: "rush" };
  }
  if (type === "festival") {
    return { status: "ok", updated: pick(Math.max(0.1, Math.min(intensity, 0.6))), mode: "festival" };
  }
  if (type === "emergency") {
    return { status: "ok", updated: pick(Math.max(0.05, Math.min(intensity, 0.3))), mode: "emergency" };
  }
  return { status: "noop", message: "unknown scenario" };
}

