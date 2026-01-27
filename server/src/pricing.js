export function currentMultiplier(occupancy) {
  if (occupancy < 0.5) return 1.0;
  if (occupancy < 0.8) return 1.2;
  return 1.5;
}

function timeBandMultiplier(now) {
  const t = now.getHours() + now.getMinutes() / 60;
  const inMorning = t >= 7 && t <= 10;
  const inEvening = t >= 16 && t <= 19.5;
  if (inMorning || inEvening) return 1.15;
  return 1.0;
}

export function computePrices(grid) {
  const now = new Date();
  const lotOcc = grid.occupancy();
  const base = 2.5;
  const surge = currentMultiplier(lotOcc) * timeBandMultiplier(now);
  const prices = {};
  grid.slots.forEach((slot, id) => {
    const zoneOcc = grid.occupancy(slot.zone);
    const zoneSurge = currentMultiplier(zoneOcc);
    const locationFactor = slot.zone === "A" ? 1.1 : 1.0;
    prices[id] = Number((base * surge * zoneSurge * locationFactor).toFixed(2));
  });
  return prices;
}

