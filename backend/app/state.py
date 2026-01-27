from __future__ import annotations

import asyncio
import random
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional


@dataclass
class Slot:
    id: str
    row: int
    col: int
    zone: str
    status: int  # 0 = vacant, 1 = occupied, 2 = unavailable
    type: str = "standard"  # standard | ev | accessible
    price: float = 2.5
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "row": self.row,
            "col": self.col,
            "zone": self.zone,
            "status": self.status,
            "type": self.type,
            "price": round(self.price, 2),
            "updated_at": self.updated_at.isoformat() + "Z",
        }


class GridState:
    """In-memory digital twin for a single lot."""

    def __init__(self, rows: int = 8, cols: int = 10):
        self.rows = rows
        self.cols = cols
        self.slots: Dict[str, Slot] = {}
        self.lot_id = "central-lot"
        self._lock = asyncio.Lock()
        self._seed()

    def _seed(self):
        zones = ["A", "B"]
        for r in range(self.rows):
            for c in range(self.cols):
                slot_id = f"S-{r}-{c}"
                zone = zones[r % len(zones)]
                slot_type = random.choice(["standard"] * 6 + ["ev", "accessible"])
                self.slots[slot_id] = Slot(
                    id=slot_id,
                    row=r,
                    col=c,
                    zone=zone,
                    status=0,
                    type=slot_type,
                    price=2.5,
                )

    async def set_status(self, slot_id: str, status: int, price: Optional[float] = None):
        async with self._lock:
            if slot_id not in self.slots:
                raise KeyError(slot_id)
            slot = self.slots[slot_id]
            slot.status = status
            if price is not None:
                slot.price = price
            slot.updated_at = datetime.utcnow()
            return slot

    async def bulk_update(
        self, slot_ids: List[str], status: Optional[int] = None, price: Optional[float] = None
    ) -> List[Slot]:
        updated = []
        async with self._lock:
            for slot_id in slot_ids:
                if slot_id not in self.slots:
                    continue
                slot = self.slots[slot_id]
                if status is not None:
                    slot.status = status
                if price is not None:
                    slot.price = price
                slot.updated_at = datetime.utcnow()
                updated.append(slot)
        return updated

    def snapshot(self) -> Dict:
        return {
            "lot_id": self.lot_id,
            "rows": self.rows,
            "cols": self.cols,
            "slots": [s.to_dict() for s in self.slots.values()],
        }

    def occupancy(self, zone: Optional[str] = None) -> float:
        slots = [s for s in self.slots.values() if zone is None or s.zone == zone]
        if not slots:
            return 0.0
        occupied = sum(1 for s in slots if s.status == 1)
        return occupied / len(slots)


grid = GridState()

