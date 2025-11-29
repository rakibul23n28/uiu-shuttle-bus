const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Routes with intermediate points for realistic path
let routes = [
  {
    id: "kuril",
    name: "Kuril → UIU ",
    color: "#FF0000",
    coords: [
      [23.820610868952375, 90.41957754437615],
      [23.8251069967925, 90.42221383440064],
      [23.830168129045163, 90.44791889543795],
      [23.80396154887558, 90.45033218988371],

      [23.80396154887558, 90.45033218988371],
      [23.80300039928186, 90.45003441862734],
      [23.801919331835172, 90.44902257435265],
      [23.801375977699635, 90.44858014148011],
      [23.79711779787257, 90.44939124046348],
      [23.797319850153688, 90.45023416569579],
    ],
    stops: [],
  },
  {
    id: "aftab",
    name: "Aftab Nagar → UIU ",
    color: "#008000",
    coords: [
      [23.767884498265367, 90.4258368692018],
      [23.76789912540912, 90.42581740900695],
      [23.76405310289068, 90.4347952022164],
      [23.76405310289068, 90.4347952022164],
      [23.76559756281525, 90.43753126655618],
      [23.76447066141081, 90.45266923672],
      [23.777247678885225, 90.45387573530141],
      [23.776956890520168, 90.45774226691996],
      [23.787744267955404, 90.45716978278523],
      [23.787744267955404, 90.45716978278523],
      [23.7875866293095, 90.45725558695712],
      [23.7875866293095, 90.45725558695712],
      [23.78784161569059, 90.45688471307491],
      [23.78784161569059, 90.45688471307491],
      [23.796059384212644, 90.45541270269769],
      [23.79457946576137, 90.4499346634726],
      [23.79711779787257, 90.44939124046348],
      [23.797319850153688, 90.45023416569579],
    ],
    stops: [],
  },
  {
    id: "notun",
    name: "Notun Bazar → UIU ",
    color: "#0000FF",
    coords: [
      [23.797895742733147, 90.4247491033753],
      [23.798118807771946, 90.4273954334202],
      [23.79854761578896, 90.4317223024376],
      [23.79873842031536, 90.43561955367018],
      [23.79873842031536, 90.43561955367018],
      [23.800285967657903, 90.44870354597657],
      [23.79711779787257, 90.44939124046348],
      [23.797319850153688, 90.45023416569579],
    ],
    stops: [],
  },
];

// Active shares
const activeShares = new Map();

// Haversine distance
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes bus positions by clustering user locations within 20m and limiting clusters to 10.
 * The final position for a route is the average of these cluster centroids.
 */
function computeBusPositions() {
  const MIN_DISTANCE_M = 20; // 20 meters max distance for clustering
  const MAX_CLUSTERS = 10; // Maximum number of cluster centroids to use for averaging // 1. Group shares by route

  const sharesPerRoute = {};
  for (const share of activeShares.values()) {
    if (share.lat && share.lng) {
      if (!sharesPerRoute[share.routeId]) {
        sharesPerRoute[share.routeId] = [];
      }
      sharesPerRoute[share.routeId].push(share);
    }
  }

  const finalPositions = {};

  for (const routeId of Object.keys(sharesPerRoute)) {
    let shares = sharesPerRoute[routeId];
    let clusters = []; // 2. Clustering Logic

    let assignedShareIds = new Set();
    for (const share of shares) {
      if (assignedShareIds.has(share.socketId)) continue; // Start a new cluster with this share

      let currentCluster = {
        latSum: share.lat,
        lngSum: share.lng,
        count: 1, // Number of members in this cluster
        memberIds: [share.socketId],
      };
      assignedShareIds.add(share.socketId); // Find other nearby shares and add them to the cluster

      for (const otherShare of shares) {
        if (!assignedShareIds.has(otherShare.socketId)) {
          // Check distance to the first share in the cluster (a simple clustering method)
          const dist = haversine(
            share.lat,
            share.lng,
            otherShare.lat,
            otherShare.lng
          );
          if (dist < MIN_DISTANCE_M) {
            currentCluster.latSum += otherShare.lat;
            currentCluster.lngSum += otherShare.lng;
            currentCluster.count += 1;
            currentCluster.memberIds.push(otherShare.socketId);
            assignedShareIds.add(otherShare.socketId);
          }
        }
      } // Calculate cluster centroid
      currentCluster.lat = currentCluster.latSum / currentCluster.count;
      currentCluster.lng = currentCluster.lngSum / currentCluster.count;

      clusters.push(currentCluster);
    } // 3. Limit clusters used for the final position calculation // We only use the centroids of the first MAX_CLUSTERS detected.

    const effectiveClusters = clusters.slice(0, MAX_CLUSTERS);
    if (effectiveClusters.length === 0) continue; // 4. Compute final route average position from cluster centroids

    let finalLatSum = 0;
    let finalLngSum = 0; // Calculate the simple average of the *cluster centroids*
    effectiveClusters.forEach((cluster) => {
      finalLatSum += cluster.lat;
      finalLngSum += cluster.lng;
    });
    const finalLat = finalLatSum / effectiveClusters.length;
    const finalLng = finalLngSum / effectiveClusters.length; // Store result for this route
    finalPositions[routeId] = {
      lat: finalLat,
      lng: finalLng, // The count is the total number of unique users sharing their location
      count: shares.length,
      clusterCount: effectiveClusters.length,
    };
  }

  return finalPositions;
}

// Emit bus positions every 2s
setInterval(() => {
  const busPositions = computeBusPositions();
  const payload = {};
  for (const r of routes) {
    const pos = busPositions[r.id] || null;
    let eta = null;
    if (pos) {
      const uni = r.coords[r.coords.length - 1];
      const dist = haversine(pos.lat, pos.lng, uni[0], uni[1]);
      const avgSpeedMps = 8.33; // Approx 30 km/h
      eta = Math.round(dist / avgSpeedMps);
    }
    payload[r.id] = {
      route: r,
      position: pos,
      eta, // pos.count is the total number of sharers for this route
      sharers: (pos && pos.count) || 0,
    };
  }
  io.emit("buses:update", payload);
}, 2000);

// Cleanup stale shares
setInterval(() => {
  const now = Date.now();
  const stale = [];
  for (const [sid, share] of activeShares.entries()) {
    if (now - share.ts > 3 * 60 * 1000) stale.push(sid);
  }
  stale.forEach((sid) => activeShares.delete(sid));
  if (stale.length) io.emit("shares:staleRemoved", stale);
}, 30 * 1000);

// Socket connections
io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("share:start", (data) => {
    activeShares.set(socket.id, {
      socketId: socket.id,
      routeId: data.routeId,
      lat: null,
      lng: null,
      speed: 0,
      ts: Date.now(),
    });
    socket.join(data.routeId);
    io.emit("shares:changed", {
      action: "start",
      socketId: socket.id,
      routeId: data.routeId,
    });
  });

  socket.on("share:pos", (data) => {
    const existing = activeShares.get(socket.id);
    if (existing) {
      existing.lat = data.lat;
      existing.lng = data.lng;
      existing.speed = data.speed || existing.speed;
      existing.ts = Date.now();
      activeShares.set(socket.id, existing);
    }
  });

  socket.on("share:stop", () => {
    activeShares.delete(socket.id);
    io.emit("shares:changed", { action: "stop", socketId: socket.id });
  });

  socket.on("disconnect", () => {
    activeShares.delete(socket.id);
    io.emit("shares:changed", { action: "disconnect", socketId: socket.id });
  });
});

// REST API for routes
app.get("/api/routes", (req, res) => res.json(routes));
app.post("/api/routes", (req, res) => {
  const r = req.body;
  routes.push(r);
  res.json({ ok: true, routes });
});
app.delete("/api/routes/:id", (req, res) => {
  routes = routes.filter((x) => x.id !== req.params.id);
  res.json({ ok: true, routes });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "localhost", () =>
  console.log(`Socket server listening on http://localhost:${PORT}`)
);
