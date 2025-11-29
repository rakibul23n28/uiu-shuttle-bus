"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import useSocket from "../hooks/useSocket";
import { getRoutes } from "../lib/routes";
import Navbar from "@/components/Navbar";
import {
  HiLocationMarker,
  HiUser,
  HiPhone,
  HiClock,
  HiCalendar,
  HiX,
  HiChevronRight,
  HiOutlineLightningBolt,
  HiTruck,
  HiXCircle,
  HiStop,
} from "react-icons/hi";

// Define the required Socket type
interface SocketInterface {
  emit: (event: string, data: any) => void;
}

// Use dynamic import for the map component to ensure it's client-side only
const ShuttleMap = dynamic(() => import("../components/ShuttleMap"), {
  ssr: false,
});

// ---- Types (Kept as is) ----
interface Route {
  id: string;
  name: string;
  color?: string;
}

interface ServerRouteData {
  route: Route;
  position: { lat: number; lng: number } | null;
  eta: number | null; // Estimated Time of Arrival in seconds
  sharers: number;
}

// Map from routeId to ServerRouteData
interface LiveServerData {
  [key: string]: ServerRouteData;
}

interface Schedule {
  from: string;
  to: string;
  times: string[];
  offDays?: string;
}

type Direction = "fromUIU" | "toUIU";

interface RouteSchedules {
  fromUIU: Schedule;
  toUIU: Schedule;
}

// ---- Data (Kept as is) ----
const schedules: Record<string, RouteSchedules> = {
  Aftab: {
    fromUIU: {
      from: "UIU",
      to: "Aftab",
      times: ["10:00 AM", "12:30 PM", "03:10 PM"],
      offDays: "Thursday, Friday",
    },
    toUIU: {
      from: "Aftab",
      to: "UIU",
      times: ["10:00 AM", "12:30 PM", "04:10 PM"],
    },
  },
  "Notun Bazar": {
    fromUIU: {
      from: "UIU",
      to: "Notun Bazar",
      times: ["09:30 AM", "01:00 PM", "04:00 PM"],
      offDays: "Friday",
    },
    toUIU: {
      from: "Notun Bazar",
      to: "UIU",
      times: ["10:00 AM", "01:30 PM", "05:00 PM"],
    },
  },
  Kuril: {
    fromUIU: {
      from: "UIU",
      to: "Kuril",
      times: ["08:00 AM", "11:30 AM", "02:00 PM"],
      offDays: "Saturday",
    },
    toUIU: {
      from: "Kuril",
      to: "UIU",
      times: ["09:30 AM", "12:00 PM", "03:30 PM"],
    },
  },
};

const supervisors: Record<string, { name: string; contact: string }> = {
  Aftab: { name: "Mr. Rahim", contact: "+880-170-0000001" },
  "Notun Bazar": { name: "Ms. Salma", contact: "+880-170-0000002" },
  Kuril: { name: "Mr. Karim", contact: "+880-170-0000003" },
};

// Map route names in the schedules/supervisors data to route IDs in the server data
const ROUTE_NAME_TO_ID: Record<string, string> = {
  Kuril: "kuril",
  Aftab: "aftab",
  "Notun Bazar": "notun",
};

// Define colors for better UI theme consistency
const THEME_COLOR = "#4F46E5"; // Indigo-600
const ACCENT_COLOR = "#F68B1F"; // Original Orange

// ---- Utility Function for Time Calculation (Kept as is) ----
function findNextTrip(times: string[]): string | null {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  for (const timeStr of times) {
    const parts = timeStr.match(/(\d{1,2}):(\d{2}) (AM|PM)/i);
    if (!parts) continue;

    let hour = parseInt(parts[1], 10);
    const minute = parseInt(parts[2], 10);
    const ampm = parts[3].toUpperCase();

    if (ampm === "PM" && hour !== 12) {
      hour += 12;
    } else if (ampm === "AM" && hour === 12) {
      hour = 0;
    }

    if (
      hour > currentHour ||
      (hour === currentHour && minute > currentMinute)
    ) {
      return timeStr;
    }
  }
  return null;
}

// ---- Schedule Modal Component (Cleaned up) ----

function ScheduleModal({
  routeName,
  schedules,
  onClose,
}: {
  routeName: string;
  schedules: RouteSchedules;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Direction>("fromUIU");
  const scheduleData = schedules[activeTab];
  const nextTripTime = findNextTrip(scheduleData.times);

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center p-4 z-50 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 relative shadow-2xl transform scale-100 transition-transform duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition p-2 rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          <HiX className="h-6 w-6" />
        </button>

        <h2
          className={`font-extrabold text-2xl text-center mb-6 text-indigo-700`}
        >
          🚌 {routeName} Schedule
        </h2>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab("fromUIU")}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "fromUIU"
                ? `bg-indigo-600 text-white shadow-md`
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            UIU → {routeName}
          </button>
          <button
            onClick={() => setActiveTab("toUIU")}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "toUIU"
                ? `bg-indigo-600 text-white shadow-md`
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {routeName} → UIU
          </button>
        </div>

        {/* Schedule Content */}
        <div className="bg-white p-5 rounded-2xl shadow-inner border border-gray-100">
          <p className="font-bold text-xl text-gray-800 mb-4 flex items-center">
            <HiChevronRight className="h-5 w-5 mr-2 text-green-500" />
            Trip: **{scheduleData.from}**
            <span className="mx-2 text-gray-400">→</span> **{scheduleData.to}**
          </p>

          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <HiClock className="h-5 w-5 mr-2 text-indigo-500" /> All Scheduled
            Times:
          </h3>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {scheduleData.times.map((t, i) => {
              const isNext = t === nextTripTime;
              return (
                <li
                  key={i}
                  className={`text-center py-2 rounded-lg font-mono text-sm font-bold transition ${
                    isNext
                      ? "bg-yellow-500 text-gray-900 ring-4 ring-yellow-200 shadow-md"
                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                  }`}
                >
                  {t}
                  {isNext && (
                    <span className="ml-1 text-xs font-extrabold flex items-center justify-center">
                      <HiOutlineLightningBolt className="w-4 h-4 mr-1" /> NEXT
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Next Trip Highlight */}
        <div
          className={`mt-4 p-4 rounded-xl shadow-inner border ${
            nextTripTime
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          {nextTripTime ? (
            <p className="text-center font-extrabold text-green-700 text-lg flex items-center justify-center">
              <HiClock className="h-6 w-6 mr-2 animate-pulse" />
              Next Available Trip: {nextTripTime}
            </p>
          ) : (
            <p className="text-center font-bold text-red-700 text-base">
              No more scheduled trips for today. Check again tomorrow!
            </p>
          )}
        </div>

        {/* Off Days */}
        <p className="mt-6 text-center text-sm font-semibold text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl flex items-center justify-center">
          <HiCalendar className="h-5 w-5 mr-2" />
          SERVICE SUSPENDED ON: **
          {schedules.fromUIU.offDays || "No Regular Off Days"}**
        </p>
      </div>
    </div>
  );
}

// ---- Main Component (Integrates Live Data - Cleaned up) ----

export default function HomePage() {
  // Note: Removed the explicit type assertion as useSocket should handle the return types
  const { data, socket } = useSocket() as {
    data: LiveServerData | null;
    socket: SocketInterface | null;
  };

  const [routes, setRoutes] = useState<Route[]>([]);
  const [modalRoute, setModalRoute] = useState<string | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);

  const [routeId, setRouteId] = useState<string>("kuril");
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Fetch Routes
  useEffect(() => {
    getRoutes().then((r) => {
      setRoutes(r || []);
      if (r && r.length > 0) {
        setRouteId(r[0].id.toLowerCase());
      }
    });
  }, []);

  // --- Hook into useSocket to manage sharing state correctly ---
  useEffect(() => {
    if (!data) return;

    const sharingRouteId = routes.find((r) => r.id === routeId)?.id;

    if (
      sharing &&
      sharingRouteId &&
      data[sharingRouteId] &&
      data[sharingRouteId].sharers === 0
    ) {
      // Logic to handle stale tracking removal
    }
  }, [data, sharing, routeId, routes]);

  // Start Sharing Location
  function startSharing() {
    if (!socket) {
      alert("Connection not ready. Please try again.");
      return;
    }

    const selectedRoute = routes.find((r) => r.id === routeId);
    if (!selectedRoute) {
      alert("Please select a valid route.");
      return;
    }

    socket.emit("share:start", { routeId });

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        socket.emit("share:pos", { lat, lng, speed: pos.coords.speed || 0 });
      },
      (err) => {
        alert("Geolocation Error: " + err.message);
        stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
    );

    watchIdRef.current = id;
    setSharing(true);
    setShowSharePanel(false);
  }

  // Stop Sharing
  function stopSharing() {
    if (!socket) return;

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;

    // FIX: Added empty object payload for TypeScript compatibility
    socket.emit("share:stop", {});
    setSharing(false);
  }

  // Function to map route name to its ID
  const getRouteIdFromName = (name: string) => ROUTE_NAME_TO_ID[name] || "";

  // --- Helper function to render the live status UI ---
  const renderLiveStatus = (liveData: ServerRouteData | undefined) => {
    if (!liveData) {
      return (
        <div className="flex items-center gap-2 text-gray-500 bg-gray-100 p-2 rounded-lg text-sm font-semibold">
          <HiXCircle className="h-5 w-5" />
          <span>No Live Tracking</span>
        </div>
      );
    }

    const isRunning = liveData.position !== null && liveData.sharers > 0;
    const etaMinutes = liveData.eta ? Math.ceil(liveData.eta / 60) : null;

    let statusText;
    let statusColor;
    let StatusIcon;

    if (isRunning) {
      statusText = "Bus Live";
      statusColor = "text-green-600";
      StatusIcon = HiTruck;
    } else if (liveData.sharers > 0) {
      statusText = "Awaiting Position";
      statusColor = "text-yellow-600";
      StatusIcon = HiStop;
    } else {
      statusText = "Inactive";
      statusColor = "text-red-500";
      StatusIcon = HiXCircle;
    }

    return (
      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* 1. Bus Status */}
        <div
          className={`flex items-center gap-2 p-2 rounded-lg bg-white shadow-sm border border-gray-100 ${statusColor}`}
        >
          <StatusIcon className="h-5 w-5 font-bold" />
          <span className="text-sm font-extrabold">{statusText}</span>
        </div>

        {/* 2. ETA to UIU */}
        <div
          className={`flex items-center gap-2 p-2 rounded-lg bg-white shadow-sm border border-gray-100 ${
            isRunning ? "text-indigo-600" : "text-gray-500"
          }`}
        >
          <HiClock className="h-5 w-5" />
          <span className="text-sm font-semibold">
            ETA:{" "}
            {isRunning && etaMinutes !== null ? `${etaMinutes} min` : "N/A"}
          </span>
        </div>

        {/* 3. Sharer Count */}
        <div className="col-span-2 flex items-center gap-2 p-2 rounded-lg bg-white shadow-sm border border-gray-100 text-gray-700">
          <HiUser className="h-5 w-5 text-purple-500" />
          <span className="text-sm font-semibold">
            Sharers: **{liveData.sharers}** on Route
          </span>
        </div>
      </div>
    );
  };
  // --- END: Helper function ---

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 font-sans bg-gray-50 min-h-screen">
      <Navbar themeColor={THEME_COLOR} />

      {/* ---- Route Cards ---- */}
      <section className="mt-8 mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 pb-2">
          Route Information & Live Status 🚦
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(schedules).map((routeName) => {
            const supervisor = supervisors[routeName];
            const routeId = getRouteIdFromName(routeName);
            const liveData = data ? data[routeId] : undefined;

            return (
              <div
                key={routeName}
                className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-indigo-500 hover:shadow-2xl hover:scale-[1.02] transform transition-all duration-300 overflow-hidden group"
              >
                <h3 className="text-gray-900 font-bold text-xl mb-3 flex items-center">
                  <span className={`text-[${ACCENT_COLOR}] mr-2`}>📍</span>
                  {routeName}
                </h3>

                {/* INJECT LIVE STATUS HERE */}
                {renderLiveStatus(liveData)}
                <hr className="my-4 border-gray-100" />
                {/* END LIVE STATUS */}

                <div className="space-y-3 mb-4 text-gray-700 text-sm">
                  <div className="flex items-center gap-2">
                    <HiUser className="h-5 w-5 text-indigo-500" />
                    <span className="font-semibold">
                      Supervisor: {supervisor.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <HiPhone className="h-5 w-5 text-indigo-500" />
                    <span>Contact: {supervisor.contact}</span>
                  </div>
                </div>

                <button
                  onClick={() => setModalRoute(routeName)}
                  className={`w-full py-3 mt-2 rounded-xl text-white font-bold text-base bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:bg-indigo-800`}
                >
                  View Schedule
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <hr className="my-8 border-gray-200" />

      {/* ---- Live Map Section ---- */}
      <section className="mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 pb-2">
          Live Shuttle Tracker 🛰️
        </h2>
        <div className="h-[60vh] rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
          <ShuttleMap routes={routes || []} serverData={data} />
        </div>
      </section>

      {/* ---- Schedule Modal (Conditional Rendering) ---- */}
      {modalRoute && schedules[modalRoute] && (
        <ScheduleModal
          routeName={modalRoute}
          schedules={schedules[modalRoute]}
          onClose={() => setModalRoute(null)}
        />
      )}

      {/* ---- Share Location Floating Button ---- */}
      <button
        onClick={() => {
          setShowSharePanel(!showSharePanel);
        }}
        className={`fixed bottom-8 right-8 z-50 transition-all duration-300 ${
          sharing
            ? "bg-red-500 hover:bg-red-600"
            : // FIX: Ensure ACCENT_COLOR is correctly used in template literal without unnecessary array syntax
              `bg-[${ACCENT_COLOR}] hover:bg-[#D47113]`
        } text-white bg-green-500 px-5 py-4 rounded-full shadow-xl text-lg font-semibold flex items-center space-x-2`}
      >
        <HiLocationMarker className="h-6 w-6" />
        <span>{sharing ? "Sharing Live" : "Share Location"}</span>
      </button>

      {/* ---- Share Panel ---- */}
      {showSharePanel && (
        <div className="fixed bottom-24 right-8 w-80 bg-white rounded-3xl shadow-2xl p-5 z-50 border-t-4 border-indigo-500 animate-slide-in">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-xl text-gray-800">
              Start Sharing 📢
            </h3>
            <button
              className="text-gray-400 hover:text-red-500 text-xl font-bold transition"
              onClick={() => setShowSharePanel(false)}
              aria-label="Close share panel"
            >
              <HiX />
            </button>
          </div>

          <p className="text-sm mt-2 text-indigo-700 bg-indigo-50 p-2 rounded-lg font-medium">
            💡 **When You are in a Shuttle Bus.**
          </p>

          <label
            htmlFor="route-select"
            className="block text-gray-700 mt-4 mb-2 font-medium"
          >
            Select Route:
          </label>

          <select
            id="route-select"
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            onClick={!sharing ? startSharing : stopSharing}
            className={`w-full py-3 mt-4 rounded-xl text-white bg-green-500 font-bold text-base shadow-lg transition-all ${
              !sharing
                ? `bg-[${ACCENT_COLOR}] hover:bg-[#D47113]`
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {!sharing ? "Activate Live Tracker" : "Stop Tracking"}
          </button>

          {/* Status Message */}
          {sharing && (
            <p className="text-center text-sm mt-3 text-green-700 font-semibold">
              Location is being shared live on route **
              {routes.find((r) => r.id === routeId)?.name || routeId}**.
            </p>
          )}
        </div>
      )}

      <footer className="text-center text-gray-500 text-sm mt-12 py-4 border-t border-gray-200">
        © {new Date().getFullYear()} UIU Shuttle Tracker. Designed for a better
        commute experience.
      </footer>
    </main>
  );
}
