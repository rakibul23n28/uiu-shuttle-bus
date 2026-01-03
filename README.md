# UIU Shuttle Bus Application 🚌

A **real-time shuttle bus tracking and communication system** for **United International University (UIU)**. The application allows students to collaboratively share live bus locations, estimate arrival times (ETA), and chat with others on the same route using **Socket.IO**.

---

## ✨ Key Features

- 🗺️ **Real-time bus position tracking** (crowd-sourced)
- 👥 **Multiple users share location** for the same bus
- 📊 **Smart clustering & averaging** of GPS data
- ⏱️ **Automatic ETA calculation** to UIU
- 💬 **Route-based live chat system**
- 🚏 Predefined UIU shuttle routes
- 🔄 Auto cleanup of inactive users

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Real-time Communication:** Socket.IO
- **Utilities:** CORS, REST API
- **Math:** Haversine formula (distance calculation)

---

## 📂 Project Structure

```plaintext
.
├── server.js          # Main Express + Socket.IO server
├── package.json       # Project dependencies
└── README.md          # Documentation
```

---

## 🚌 Available Shuttle Routes

| Route ID | Route Name        |
| -------- | ----------------- |
| `kuril`  | Kuril → UIU       |
| `aftab`  | Aftab Nagar → UIU |
| `notun`  | Notun Bazar → UIU |

Each route contains predefined GPS coordinates used for ETA calculation.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

---

### Installation

```bash
git clone https://github.com/rakibul23n28/uiu-shuttle-bus.git
cd uiu-shuttle-bus
npm install
```

---

### Run the Server

```bash
node server.js
```

Server will start at:

```
http://localhost:4000
```

---

## 🔌 REST API Endpoints

### Get all routes

```
GET /api/routes
```

### Add a new route

```
POST /api/routes
```

### Delete a route

```
DELETE /api/routes/:id
```

---

## 🔄 Socket.IO Events

### Location Sharing

| Event            | Direction       | Description                   |
| ---------------- | --------------- | ----------------------------- |
| `share:start`    | Client → Server | Start sharing location        |
| `share:pos`      | Client → Server | Send GPS coordinates          |
| `share:stop`     | Client → Server | Stop sharing                  |
| `buses:update`   | Server → Client | Broadcast bus positions & ETA |
| `shares:changed` | Server → Client | User join/leave updates       |

---

### Chat System

| Event         | Direction       | Description           |
| ------------- | --------------- | --------------------- |
| `chat:join`   | Client → Server | Join route chat       |
| `chat:init`   | Server → Client | Initial chat history  |
| `chat:send`   | Client → Server | Send message          |
| `chat:update` | Server → Client | Broadcast new message |

---

## 🧠 How Bus Position is Calculated

1. Users share live GPS locations
2. Nearby users (within **20 meters**) are clustered
3. Average location is computed
4. Distance to UIU is calculated using **Haversine formula**
5. ETA is estimated using average speed (5.33 m/s)

---

## 🧹 Automatic Cleanup

- Users inactive for **3 minutes** are removed
- Cleanup runs every **30 seconds**

---

## 🎯 Use Case Scenario

A student opens the app, selects their shuttle route and bus number, and starts sharing location. Other students instantly see the bus moving on the map, ETA updates every 2 seconds, and can communicate via route chat.

---

## 🔮 Future Improvements

- Google Maps integration
- Driver-only verified tracking
- Authentication system
- Admin dashboard
- Mobile app version

---

## 👨‍💻 Author

**Rakibul Hasan**
Student, United International University

---

## 📜 License

Educational use only. Free to modify and extend.

---

⭐ If you find this project useful, consider giving it a star!
