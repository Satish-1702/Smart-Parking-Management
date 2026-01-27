from __future__ import annotations

import random
from typing import Dict, List

from .state import GridState


def run_scenario(grid: GridState, scenario: str, intensity: float = 0.5) -> Dict:
    """
    Apply a lightweight scenario to the grid.
    intensity: 0..1 indicating how strong the scenario is.
    """
    total_slots = list(grid.slots.keys())
    updates: List[str] = []
    if scenario == "rush":
        count = int(len(total_slots) * max(0.2, min(intensity, 1.0)))
        updates = random.sample(total_slots, count)
        # rush hour: more occupied
        random.shuffle(updates)
        return {"status": "ok", "updated": updates, "mode": "rush"}
    if scenario == "festival":
        count = int(len(total_slots) * max(0.1, min(intensity, 0.6)))
        updates = random.sample(total_slots, count)
        return {"status": "ok", "updated": updates, "mode": "festival"}
    if scenario == "emergency":
        count = int(len(total_slots) * max(0.05, min(intensity, 0.3)))
        updates = random.sample(total_slots, count)
        return {"status": "ok", "updated": updates, "mode": "emergency"}
    return {"status": "noop", "message": "unknown scenario"}

