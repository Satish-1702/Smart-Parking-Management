class Slot {
  constructor({ id, row, col, zone, status = 0, type = "standard", price = 2.5 }) {
    this.id = id;
    this.row = row;
    this.col = col;
    this.zone = zone;
    this.status = status; // 0 vacant, 1 occupied, 2 unavailable
    this.type = type;
    this.price = price;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      row: this.row,
      col: this.col,
      zone: this.zone,
      status: this.status,
      type: this.type,
      price: Number(this.price.toFixed(2)),
      updated_at: this.updatedAt.toISOString(),
    };
  }

  toRecord() {
    return {
      id: this.id,
      row: this.row,
      col: this.col,
      zone: this.zone,
      status: this.status,
      type: this.type,
      price: this.price,
      updatedAt: this.updatedAt,
    };
  }
}

export class GridState {
  constructor(rows = 8, cols = 10) {
    this.rows = rows;
    this.cols = cols;
    this.lotId = "central-lot";
    this.slots = new Map();
  }

  seed() {
    const zones = ["A", "B"];
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const slotId = `S-${r}-${c}`;
        const zone = zones[r % zones.length];
        const type = Math.random() < 0.15 ? "ev" : Math.random() < 0.25 ? "accessible" : "standard";
        this.slots.set(
          slotId,
          new Slot({
            id: slotId,
            row: r,
            col: c,
            zone,
            status: 0,
            type,
            price: 2.5,
          })
        );
      }
    }
  }

  async loadFromModel(SlotModel) {
    const docs = await SlotModel.find({});
    if (!docs.length) {
      this.seed();
      await SlotModel.insertMany(Array.from(this.slots.values()).map((s) => s.toRecord()));
      return;
    }
    this.slots.clear();
    docs.forEach((doc) => {
      this.slots.set(
        doc.id,
        new Slot({
          id: doc.id,
          row: doc.row,
          col: doc.col,
          zone: doc.zone,
          status: doc.status,
          type: doc.type,
          price: doc.price,
        })
      );
    });
  }

  snapshot() {
    return {
      lot_id: this.lotId,
      rows: this.rows,
      cols: this.cols,
      slots: Array.from(this.slots.values()).map((s) => s.toJSON()),
    };
  }

  occupancy(zone) {
    const slots = Array.from(this.slots.values()).filter((s) => !zone || s.zone === zone);
    if (!slots.length) return 0;
    const occupied = slots.filter((s) => s.status === 1).length;
    return occupied / slots.length;
  }

  setStatus(slotId, status, price) {
    if (!this.slots.has(slotId)) throw new Error("not-found");
    const slot = this.slots.get(slotId);
    slot.status = status;
    if (price !== undefined) slot.price = price;
    slot.updatedAt = new Date();
    return slot;
  }

  async persistSlot(SlotModel, slot) {
    await SlotModel.findOneAndUpdate(
      { id: slot.id },
      {
        row: slot.row,
        col: slot.col,
        zone: slot.zone,
        status: slot.status,
        type: slot.type,
        price: slot.price,
        updatedAt: slot.updatedAt,
      },
      { upsert: true, new: true }
    );
  }

  bulkUpdate(slotIds, status, price) {
    const updated = [];
    slotIds.forEach((id) => {
      if (!this.slots.has(id)) return;
      const slot = this.slots.get(id);
      if (status !== undefined) slot.status = status;
      if (price !== undefined) slot.price = price;
      slot.updatedAt = new Date();
      updated.push(slot);
    });
    return updated;
  }

  async persistBulk(SlotModel, slots) {
    const ops = slots.map((slot) => ({
      updateOne: {
        filter: { id: slot.id },
        update: {
          row: slot.row,
          col: slot.col,
          zone: slot.zone,
          status: slot.status,
          type: slot.type,
          price: slot.price,
          updatedAt: slot.updatedAt,
        },
        upsert: true,
      },
    }));
    if (ops.length) {
      await SlotModel.bulkWrite(ops);
    }
  }
}

export const grid = new GridState();

