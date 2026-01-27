from __future__ import annotations

from datetime import datetime, time
from typing import Dict

from .state import GridState


def current_multiplier(occupancy: float) -> float:
    if occupancy < 0.5:
        return 1.0
    if occupancy < 0.8:
        return 1.2
    return 1.5


def time_band_multiplier(now: datetime) -> float:
    morning_peak = time(7, 0), time(10, 0)
    evening_peak = time(16, 0), time(19, 30)
    t = now.time()
    if morning_peak[0] <= t <= morning_peak[1] or evening_peak[0] <= t <= evening_peak[1]:
        return 1.15
    return 1.0


def compute_prices(grid: GridState) -> Dict[str, float]:
    """Return suggested price per slot id."""
    now = datetime.utcnow()
    lot_occ = grid.occupancy()
    base = 2.5
    surge = current_multiplier(lot_occ) * time_band_multiplier(now)
    prices: Dict[str, float] = {}
    for slot_id, slot in grid.slots.items():
        zone_occ = grid.occupancy(slot.zone)
        zone_surge = current_multiplier(zone_occ)
        location_factor = 1.1 if slot.zone == "A" else 1.0
        prices[slot_id] = round(base * surge * zone_surge * location_factor, 2)
    return prices

