"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
// Assuming these imports are correct based on your project structure
import useSocket from "../../../hooks/useSocket";
import { getRoutes } from "../../../lib/routes";

// Components
import Navbar from "@/components/Navbar";
import ScheduleModal from "@/components/ScheduleModal";
import RouteCard from "@/components/RouteCard";
import { ShareLocationPanel } from "@/components/ShareLocationPanel";
import ChatPanel from "@/components/ChatPanel";
import { Toast } from "@/components/Toast"; // This component's internal logic is updated

// Types & Constants
import {
  Route,
  LiveServerData,
  THEME_COLOR,
  ALL_ROUTE_DATA,
  RouteName,
} from "../../../lib/constants";

const ShuttleMap = dynamic(() => import("../../../components/ShuttleMap"), {
  ssr: false,
});

// Keys for localStorage
const LS_SHARING_KEY = "shuttle_sharing_active";
const LS_BUS_NUMBER_KEY = "shuttle_bus_number";
const LS_ROUTE_ID_KEY = "shuttle_route_id";

export default function DedicatedRoutePage() {
  const params = useParams();
  const rawRouteSlug = params.routeId as string;
  const routeSlug = rawRouteSlug ? decodeURIComponent(rawRouteSlug) : "";

  // socket
  const socketHook = useSocket();
  const data = socketHook?.data ?? null;
  const socket = socketHook?.socket ?? null;

  const [routes, setRoutes] = useState<Route[]>([]);
  const [modalRoute, setModalRoute] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null); // For user feedback
  const handleCloseToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Initialize state from localStorage for persistence
  const [sharing, setSharing] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LS_SHARING_KEY) === "true";
    }
    return false;
  });
  const [busNumber, setBusNumber] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LS_BUS_NUMBER_KEY) || "";
    }
    return "";
  });

  // Route setup
  const routeName = (Object.keys(ALL_ROUTE_DATA) as RouteName[]).find(
    (name) => name.toLowerCase() === routeSlug.toLowerCase()
  );

  const routeData = routeName ? ALL_ROUTE_DATA[routeName] : undefined;
  // Determine routeId from URL slug
  const urlRouteId = routeData ? routeData.id : "";

  // routeId state: Use URL routeId, but fall back to LS routeId if sharing is true
  const [routeId, setRouteId] = useState(() => {
    if (typeof window !== "undefined") {
      const lsRouteId = localStorage.getItem(LS_ROUTE_ID_KEY);
      // Use URL ID if available, otherwise use LS ID
      return urlRouteId || lsRouteId || "";
    }
    return urlRouteId;
  });

  // Keep routeId state in sync with URL route slug
  useEffect(() => {
    if (urlRouteId && routeId !== urlRouteId) {
      setRouteId(urlRouteId);
    }
  }, [urlRouteId, routeId]);

  const watchIdRef = useRef<number | null>(null);

  // Live server data
  const liveData = (data as LiveServerData | undefined)?.[routeId];

  // Fetch routes
  useEffect(() => {
    getRoutes().then((r) => setRoutes(r || []));
  }, []);

  // Sync state with localStorage whenever sharing state, bus, or route changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_SHARING_KEY, String(sharing));
      localStorage.setItem(LS_BUS_NUMBER_KEY, busNumber);
      localStorage.setItem(LS_ROUTE_ID_KEY, routeId);
    }
  }, [sharing, busNumber, routeId]);

  // Stop Sharing logic
  const stopSharing = useCallback(
    (showConfirm: boolean = true) => {
      if (!socket) return;

      if (showConfirm) {
        const confirmStop = window.confirm(
          "Are you sure you want to stop sharing your location?"
        );
        if (!confirmStop) return;
      }

      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // Use the stored busNumber and routeId for the stop event
      const stopRouteId = localStorage.getItem(LS_ROUTE_ID_KEY) || routeId;
      const stopBusNumber =
        localStorage.getItem(LS_BUS_NUMBER_KEY) || busNumber;

      socket.emit("share:stop", {
        routeId: stopRouteId,
        busNumber: stopBusNumber,
      });

      setSharing(false);
      setToastMessage("🛑 Location tracking stopped.");
      // Clear bus number in state and local storage when stopping
      setBusNumber("");
    },
    [socket, routeId, busNumber]
  );

  // Start Sharing logic
  const startSharing = useCallback(() => {
    if (!socket || !routeId) {
      setToastMessage("⚠️ Route not ready. Try again.");
      return;
    }

    if (!busNumber) {
      setToastMessage("⚠️ Please select a bus number before sharing!");
      return;
    }

    socket.emit("share:start", { routeId, busNumber });

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          socket.emit("share:pos", {
            routeId,
            busNumber,
            lat,
            lng,
            speed: pos.coords.speed || 0,
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
          stopSharing(false); // Stop without confirmation if error
          setToastMessage("⚠️ Geolocation error, tracking stopped.");
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
      );

      watchIdRef.current = id;
      setSharing(true);
      setShowSharePanel(false);
      setToastMessage("🟢 Live tracking started successfully!");
    } catch (err) {
      console.error("Geolocation unavailable", err);
      setToastMessage("⚠️ Geolocation unavailable on this device.");
    }
  }, [socket, routeId, busNumber, stopSharing]);

  // Auto-restart sharing on component mount if localStorage indicates active session
  useEffect(() => {
    // Only attempt restart if socket is ready and previous session was active
    if (socket && sharing && routeId && busNumber) {
      setToastMessage("🔄 Attempting to resume live tracking...");
      startSharing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Clear geolocation watch on unmount (cleanup for browser tab close/hard navigation)
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Stop sharing if the user navigates away to a different route page
  useEffect(() => {
    if (sharing && routeId !== urlRouteId && urlRouteId) {
      stopSharing(false); // Stop without confirmation
      setToastMessage(
        "⚠️ Tracking stopped: Navigated to a different route page."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlRouteId, sharing, stopSharing]);

  const handleShareClick = () => {
    if (sharing) {
      stopSharing();
    } else {
      // Toggle panel only if not sharing
      setShowSharePanel((prev) => !prev);
      setShowChat(false);
    }
  };

  const handleChatClick = () => {
    setShowChat((prev) => !prev);
    setShowSharePanel(false);
  };

  const mapRoutes = useMemo(
    () => routes.filter((r) => r.id === routeId),
    [routes, routeId]
  );

  // --- Render logic starts here ---
  if (!routeData) {
    return (
      <main className="w-full max-w-5xl mx-auto p-8 min-h-screen">
        <Navbar themeColor={THEME_COLOR} />
        <div className="mt-16 text-center animate-fade-in">
          <h1 className="text-4xl font-extrabold text-red-600 mb-4">
            Route Not Found ❌
          </h1>
          <Link
            href="/"
            className="text-blue-500 hover:underline text-lg font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-6xl mx-auto min-h-screen font-sans relative px-4 md:px-6 lg:px-0">
      <Navbar themeColor={THEME_COLOR} />
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-all"
        >
          <span className="text-xl">←</span>
          <span className="text-lg font-medium">Back to All Routes</span>
        </Link>
      </div>
      {/* Header */}
      <section className="mt-6 mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Live Status: {routeName!} – UIU 🚦
        </h1>
        <p className="text-gray-500 mt-1 text-lg">
          Real-time tracking & detailed route information.
        </p>
      </section>
      {/* Map */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-3 mb-4">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          Live Map 🛰️
        </h2>

        <div className="h-[60vh] rounded-3xl overflow-hidden shadow-xl border bg-white">
          <ShuttleMap
            routes={mapRoutes}
            serverData={data}
            center_coords={routeData.center_coords}
          />
        </div>
      </section>
      {/* Route Info */}
      <section className="mb-10">
        <h2 className="text-3xl font-bold text-gray-900 border-b pb-2 mb-6">
          Route Information ℹ️
        </h2>

        <RouteCard
          routeName={routeName!}
          routeData={routeData}
          liveData={liveData}
          onViewSchedule={setModalRoute}
        />
      </section>
      {/* Schedule Modal */}
      {modalRoute && ALL_ROUTE_DATA[modalRoute] && (
        <ScheduleModal
          routeName={modalRoute}
          schedules={ALL_ROUTE_DATA[modalRoute].schedules}
          onClose={() => setModalRoute(null)}
        />
      )}
      {/* Floating Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col items-end gap-3 z-50">
        <button
          onClick={handleChatClick}
          className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded shadow text-white font-medium hover:bg-green-500"
        >
          💬 Chat
        </button>

        <button
          onClick={handleShareClick}
          className={`flex items-center gap-2 px-4 py-2 rounded shadow text-white font-medium transition ${
            sharing
              ? "bg-red-600 hover:bg-red-500"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          📍 {sharing ? "Stop Sharing" : "Share Location"}
        </button>
      </div>
      {/* Overlay */}
      {(showChat || showSharePanel) && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => {
            setShowChat(false);
            setShowSharePanel(false);
          }}
        />
      )}
      {/* Chat */}
      {showChat && (
        <ChatPanel
          onClose={() => setShowChat(false)}
          chatName={routeName!}
          routeId={routeId}
          user="Anonymous"
          socket={socket}
        />
      )}
      {/* Share Location Panel */}
      {showSharePanel && !sharing && (
        <div className="fixed bottom-20 right-4 z-50">
          <ShareLocationPanel
            routes={mapRoutes}
            routeId={routeId}
            busNumber={busNumber}
            setBusNumber={setBusNumber}
            // Passing a setter that updates state AND localStorage
            setRouteId={(newId) => {
              setRouteId(newId);
              if (typeof window !== "undefined") {
                localStorage.setItem(LS_ROUTE_ID_KEY, newId);
              }
            }}
            sharing={sharing}
            startSharing={startSharing}
            stopSharing={stopSharing}
            setShowSharePanel={setShowSharePanel}
          />
        </div>
      )}
      {/* Toast Notification for User Feedback */}
      <Toast message={toastMessage} onClose={handleCloseToast} />
      <footer className="text-center text-gray-500 text-sm mt-16 py-6 border-t">
        © {new Date().getFullYear()} UIU Shuttle Tracker.
        <div className="flex justify-center mt-2">
          <a
            href="https://github.com/your-github-username/university-shuttle-bus"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 transition"
          >
            View Source Code on GitHub and Contribute!
          </a>
        </div>
      </footer>
    </main>
  );
}
