// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// -------------------- ROUTES --------------------
let routes = [
  {
    id: "kuril",
    name: "Kuril → UIU",
    color: "#FF0000",
    coords: [
      [23.820610868952375, 90.41957754437615],
      [23.8251069967925, 90.42221383440064],
      [23.830168129045163, 90.44791889543795],
      [23.80396154887558, 90.45033218988371],
      [23.80300039928186, 90.45003441862734],
      [23.801919331835172, 90.44902257435265],
      [23.801375977699635, 90.44858014148011],
      [23.79711779787257, 90.44939124046348],
      [23.797319850153688, 90.45023416569579],
    ],
  },
  {
    id: "aftab",
    name: "Aftab Nagar → UIU",
    color: "#008000",
    coords: [
      [23.767884498265367, 90.4258368692018],
      [23.76405310289068, 90.4347952022164],
      [23.76559756281525, 90.43753126655618],
      [23.76447066141081, 90.45266923672],
      [23.777247678885225, 90.45387573530141],
      [23.776956890520168, 90.45774226691996],
      [23.777060198172006, 90.45826532501356],
      [23.787563611387714, 90.45830511961553],
      [23.787744267955404, 90.45716978278523],

      [23.78783821231135, 90.45689697151754],

      [23.79605305306039, 90.45542726000716],
      [23.79457946576137, 90.4499346634726],
      [23.79711779787257, 90.44939124046348],
      [23.797319850153688, 90.45023416569579],
    ],
  },
  {
    id: "notun",
    name: "Notun Bazar → UIU",
    color: "#0000FF",
    coords: [
      [23.797895742733147, 90.4247491033753],
      [23.798118807771946, 90.4273954334202],
      [23.79854761578896, 90.4317223024376],
      [23.79873842031536, 90.43561955367018],
      [23.800285967657903, 90.44870354597657],
      [23.79711779787257, 90.44939124046348],
      [23.797319850153688, 90.45023416569579],
    ],
  },
];

// Active user shares
const activeShares = new Map();

// Chats per route
const routeChats = {};
const MAX_CHAT_MESSAGES = 50;

// -------------------- HELPER: Haversine Distance --------------------
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// -------------------- HELPER: Compute Bus Positions --------------------
function computeBusPositions() {
  const MIN_DISTANCE_M = 20; // cluster nearby sharers
  const MAX_CLUSTERS = 10;

  const groupedShares = {};

  for (const share of activeShares.values()) {
    if (!share.lat || !share.lng) continue;
    const key = `${share.routeId}_${share.busNumber}`;
    if (!groupedShares[key]) groupedShares[key] = [];
    groupedShares[key].push(share);
  }

  const finalPositions = {};

  for (const key in groupedShares) {
    const [routeId, busNumber] = key.split("_");
    const shares = groupedShares[key];

    let clusters = [];
    let assigned = new Set();

    for (const s of shares) {
      if (assigned.has(s.socketId)) continue;

      let cluster = { latSum: s.lat, lngSum: s.lng, count: 1 };
      assigned.add(s.socketId);

      for (const o of shares) {
        if (assigned.has(o.socketId)) continue;
        const dist = haversine(s.lat, s.lng, o.lat, o.lng);
        if (dist < MIN_DISTANCE_M) {
          cluster.latSum += o.lat;
          cluster.lngSum += o.lng;
          cluster.count++;
          assigned.add(o.socketId);
        }
      }

      cluster.lat = cluster.latSum / cluster.count;
      cluster.lng = cluster.lngSum / cluster.count;
      clusters.push(cluster);
    }

    const effective = clusters.slice(0, MAX_CLUSTERS);
    if (!effective.length) continue;

    const avgLat = effective.reduce((a, c) => a + c.lat, 0) / effective.length;
    const avgLng = effective.reduce((a, c) => a + c.lng, 0) / effective.length;

    finalPositions[key] = {
      routeId,
      busNumber,
      lat: avgLat,
      lng: avgLng,
      sharers: shares.length,
    };
  }

  return finalPositions;
}

// -------------------- EMIT BUS UPDATES --------------------
setInterval(() => {
  const positions = computeBusPositions();
  const payload = {};

  for (const r of routes) payload[r.id] = { buses: {} };

  for (const key in positions) {
    const p = positions[key];
    const route = routes.find((r) => r.id === p.routeId);
    if (!route) continue;

    const uniCoord = route.coords.at(-1);
    const dist = haversine(p.lat, p.lng, uniCoord[0], uniCoord[1]);
    const avgSpeed = 5.33; // m/s
    const eta = Math.round(dist / avgSpeed);

    payload[p.routeId].buses[p.busNumber] = {
      position: { lat: p.lat, lng: p.lng },
      sharers: p.sharers,
      eta,
    };
  }

  io.emit("buses:update", payload);
}, 2000);

// -------------------- CLEANUP STALE SHARES --------------------
setInterval(() => {
  const now = Date.now();
  for (const [sid, s] of activeShares.entries()) {
    if (now - s.ts > 3 * 60 * 1000) activeShares.delete(sid);
  }
}, 30000);

// -------------------- SOCKET.IO --------------------
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("share:start", ({ routeId, busNumber }) => {
    activeShares.set(socket.id, {
      socketId: socket.id,
      routeId,
      busNumber,
      lat: null,
      lng: null,
      ts: Date.now(),
    });
    socket.join(routeId);
    io.emit("shares:changed", {
      action: "start",
      socketId: socket.id,
      routeId,
      busNumber,
    });
  });

  socket.on("share:pos", ({ lat, lng }) => {
    const s = activeShares.get(socket.id);
    if (!s) return;
    s.lat = lat;
    s.lng = lng;
    s.ts = Date.now();
    activeShares.set(socket.id, s);
  });

  socket.on("share:stop", () => {
    const s = activeShares.get(socket.id);
    if (s)
      io.emit("shares:changed", {
        action: "stop",
        socketId: socket.id,
        routeId: s.routeId,
        busNumber: s.busNumber,
      });
    activeShares.delete(socket.id);
  });

  // Chat
  socket.on("chat:join", (routeId) => {
    socket.join(routeId);
    socket.emit("chat:init", { routeId, messages: routeChats[routeId] || [] });
  });

  socket.on("chat:send", ({ routeId, user, text }) => {
    if (!routeChats[routeId]) routeChats[routeId] = [];
    const msg = {
      id: Date.now(),
      user,
      text,
      selfId: socket.id,
      ts: Date.now(),
    };
    routeChats[routeId].push(msg);
    if (routeChats[routeId].length > MAX_CHAT_MESSAGES)
      routeChats[routeId].shift();
    io.to(routeId).emit("chat:update", { routeId, message: msg });
  });

  socket.on("disconnect", () => {
    const s = activeShares.get(socket.id);
    if (s)
      io.emit("shares:changed", {
        action: "disconnect",
        socketId: socket.id,
        routeId: s.routeId,
        busNumber: s.busNumber,
      });
    activeShares.delete(socket.id);
  });
});

// -------------------- REST API --------------------
app.get("/api/routes", (req, res) => res.json(routes));
app.post("/api/routes", (req, res) => {
  routes.push(req.body);
  res.json({ ok: true, routes });
});
app.delete("/api/routes/:id", (req, res) => {
  routes = routes.filter((r) => r.id !== req.params.id);
  res.json({ ok: true, routes });
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
