import { Router } from "express";
import { ParkingPlaceModel } from "../models/index.js";

const router = Router();

router.get("/places", async (req, res) => {
  try {
    const { features } = req.query;
    const filter = {};
    if (features) {
      const featureList = String(features).split(",").map((f) => f.trim()).filter(Boolean);
      if (featureList.length) {
        filter.features = { $in: featureList };
      }
    }
    const docs = await ParkingPlaceModel.find(filter).lean();
    const places = docs.map((p) => ({
      ...p,
      _id: (p._id && p._id.toString) ? p._id.toString() : String(p._id || ""),
      id: (p._id && p._id.toString) ? p._id.toString() : String(p._id || ""),
    }));
    res.json({ places });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/places/near", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusMeters = Math.min(parseFloat(req.query.radius) || 5000, 50000);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: "lat and lng are required (numbers)" });
    }

    let places;
    try {
      places = await ParkingPlaceModel.find({
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: radiusMeters,
          },
        },
      })
        .limit(20)
        .lean();
    } catch {
      // Fallback for deployments where geo index is missing or still building.
      const allWithCoords = await ParkingPlaceModel.find({
        "location.coordinates.0": { $exists: true },
        "location.coordinates.1": { $exists: true },
      }).lean();

      places = allWithCoords
        .map((p) => {
          const coords = p.location?.coordinates || [];
          const distanceMeters = haversineMeters(lat, lng, coords[1], coords[0]);
          return { ...p, _distanceMetersRaw: distanceMeters };
        })
        .filter((p) => p._distanceMetersRaw <= radiusMeters)
        .sort((a, b) => a._distanceMetersRaw - b._distanceMetersRaw)
        .slice(0, 20);
    }

    const withDistance = places.map((p) => {
      const { _distanceMetersRaw, ...place } = p;
      const coords = place.location?.coordinates;
      let distance = null;
      if (coords && coords.length >= 2) {
        distance = Math.round(haversineMeters(lat, lng, coords[1], coords[0]));
      }
      const id = (place._id && place._id.toString) ? place._id.toString() : String(place._id || "");
      return { ...place, _id: id, id: id, distance_meters: distance };
    });

    res.json({ places: withDistance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/places/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || id.length !== 24 || !/^[a-f0-9]+$/i.test(id)) {
      return res.status(400).json({ error: "invalid place id" });
    }
    const place = await ParkingPlaceModel.findById(id).lean();
    if (!place) return res.status(404).json({ error: "place not found" });
    res.json(place);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;
