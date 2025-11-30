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
      [23.820610868952375, 90.41957754437615], // Start: Kuril (Approx)
      [23.8251069967925, 90.42221383440064],
      [23.830168129045163, 90.44791889543795],
      [23.80396154887558, 90.45033218988371],
      [23.80300039928186, 90.45003441862734],
      [23.801919331835172, 90.44902257435265],
      [23.801375977699635, 90.44858014148011],
      [23.79711779787257, 90.44939124046348],
      [23.797319850153688, 90.45023416569579], // End: UIU (Approx)
    ],
    stops: [],
  },
  {
    id: "aftab",
    name: "Aftab Nagar → UIU ",
    color: "#008000",
    coords: [
      [23.767884498265367, 90.4258368692018], // Start: Aftab Nagar (Approx)
      [23.76789912540912, 90.42581740900695],
      [23.76405310289068, 90.4347952022164],
      [23.76559756281525, 90.43753126655618],
      [23.76447066141081, 90.45266923672],
      [23.777247678885225, 90.45387573530141],
      [23.776956890520168, 90.45774226691996],
      [23.787744267955404, 90.45716978278523],
      [23.7875866293095, 90.45725558695712],
      [23.78784161569059, 90.45688471307491],
      [23.796059384212644, 90.45541270269769],
      [23.79457946576137, 90.4499346634726],
      [23.79711779787257, 90.44939124046348],
      [23.797319850153688, 90.45023416569579], // End: UIU (Approx)
    ],
    stops: [],
  },
  {
    id: "notun",
    name: "Notun Bazar → UIU ",
    color: "#0000FF",
    coords: [
      [23.797895742733147, 90.4247491033753], // Start: Notun Bazar (Approx)
      [23.798118807771946, 90.4273954334202],
      [23.79854761578896, 90.4317223024376],
      [23.79873842031536, 90.43561955367018],
      [23.800285967657903, 90.44870354597657],
      [23.79711779787257, 90.44939124046348],
      [23.797319850153688, 90.45023416569579], // End: UIU (Approx)
    ],
    stops: [],
  },
];

// Active shares
const activeShares = new Map();

// Map to store the last computed bus status from computeBusPositions
let lastBusPositions = {};

// --- CONSTANTS FOR PROXIMITY LOGIC ---
const PROXIMITY_THRESHOLD_M = 400; // 400 meters

const ROUTE_PROXIMITY_POINTS = {
  kuril: {
    start: routes.find((r) => r.id === "kuril").coords[0],
    end: routes.find((r) => r.id === "kuril").coords.slice(-1)[0],
  },
  aftab: {
    start: routes.find((r) => r.id === "aftab").coords[0],
    end: routes.find((r) => r.id === "aftab").coords.slice(-1)[0],
  },
  notun: {
    start: routes.find((r) => r.id === "notun").coords[0],
    end: routes.find((r) => r.id === "notun").coords.slice(-1)[0],
  },
};

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
 * Computes bus positions by clustering user locations.
 */
function computeBusPositions() {
  const MIN_DISTANCE_M = 20;
  const MAX_CLUSTERS = 10;

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
    let clusters = [];

    let assignedShareIds = new Set();
    for (const share of shares) {
      if (assignedShareIds.has(share.socketId)) continue;

      let currentCluster = {
        latSum: share.lat,
        lngSum: share.lng,
        count: 1,
        memberIds: [share.socketId],
      };
      assignedShareIds.add(share.socketId);

      for (const otherShare of shares) {
        if (!assignedShareIds.has(otherShare.socketId)) {
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
      }

      currentCluster.lat = currentCluster.latSum / currentCluster.count;
      currentCluster.lng = currentCluster.lngSum / currentCluster.count;

      clusters.push(currentCluster);
    }

    const effectiveClusters = clusters.slice(0, MAX_CLUSTERS);
    if (effectiveClusters.length === 0) continue;

    let finalLatSum = 0;
    let finalLngSum = 0;
    effectiveClusters.forEach((cluster) => {
      finalLatSum += cluster.lat;
      finalLngSum += cluster.lng;
    });
    const finalLat = finalLatSum / effectiveClusters.length;
    const finalLng = finalLngSum / effectiveClusters.length;

    finalPositions[routeId] = {
      lat: finalLat,
      lng: finalLng,
      count: shares.length,
      clusterCount: effectiveClusters.length,
    };
  }

  return finalPositions;
}

// --- FUNCTION TO GENERATE PROXIMITY MESSAGES ---
function getProximityMessages(userLat, userLng) {
  const messages = [];

  // 1. Check all routes for proximity
  for (const routeId of Object.keys(ROUTE_PROXIMITY_POINTS)) {
    const { start, end } = ROUTE_PROXIMITY_POINTS[routeId];
    const routeData = routes.find((r) => r.id === routeId);
    const liveData = lastBusPositions[routeId] || null;

    // Calculate distances to start and end points
    const distToStart = haversine(userLat, userLng, start[0], start[1]);
    const distToEnd = haversine(userLat, userLng, end[0], end[1]);

    let message = null;

    // Check proximity to START point
    if (distToStart <= PROXIMITY_THRESHOLD_M) {
      const routeName = routeData.name.split(" → ")[0];
      if (liveData && liveData.sharers > 0) {
        const sharersCount = liveData.sharers;
        message = `📍 You are near the ${routeName} start! **${sharersCount}** 🚌 live.`;
      } else {
        message = `📍 You are near the ${routeName} start. No bus tracking now.`;
      }
    }
    // Check proximity to END point (UIU)
    else if (distToEnd <= PROXIMITY_THRESHOLD_M) {
      const routeName = routeData.name.split(" → ")[0];
      if (liveData && liveData.position) {
        const etaMinutes = liveData.eta
          ? Math.ceil(liveData.eta / 60)
          : "a few";
        message = `🚨 Bus on ${routeName} route is **${etaMinutes} min** away from UIU.`;
      } else {
        message = `🚨 No bus actively tracking towards UIU on the ${routeName} route.`;
      }
    }

    if (message) {
      messages.push({
        routeId,
        text: message,
        priority: liveData?.sharers > 0 ? 1 : 2,
      });
    }
  }

  // 2. Sort and limit the messages (max 3)
  messages.sort((a, b) => a.priority - b.priority);

  return messages.slice(0, 3);
}

// Emit bus positions every 2s (Modified to store lastBusPositions)
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
    const routePayload = {
      route: r,
      position: pos,
      eta,
      sharers: (pos && pos.count) || 0,
    };
    payload[r.id] = routePayload;
    lastBusPositions[r.id] = routePayload; // Store the latest bus status
  }
  io.emit("buses:update", payload);
}, 2000);

// NEW INTERVAL TO EMIT PROXIMITY MESSAGES TO INDIVIDUAL USERS
setInterval(() => {
  // NOTE: In a production app, you would use the *client's* non-sharing location
  // from a dedicated storage map (e.g., `userLocations`).
  // For this demonstration, we use the location of the first active sharer as a dummy
  // user location to test the proximity logic.

  const dummySharer = Array.from(activeShares.values()).find((s) => s.lat);

  io.sockets.sockets.forEach((socket) => {
    // If the user is currently sharing their location, don't show floating messages.
    if (activeShares.has(socket.id)) return;

    // Use the dummy location for all non-sharing clients
    if (dummySharer) {
      const messages = getProximityMessages(dummySharer.lat, dummySharer.lng);

      if (messages.length > 0) {
        // Emit the personalized messages back to the client
        socket.emit("user:proximityMessages", { messages });
      }
    }
  });
}, 10000); // Check every 10 seconds (less frequent than bus updates)

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
server.listen(PORT, () =>
  console.log(`Socket server listening on http://localhost:${PORT}`)
);
