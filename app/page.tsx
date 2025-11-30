"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import useSocket from "../hooks/useSocket"; // Assume this hook is available
import { getRoutes } from "../lib/routes"; // Assume this utility is available
import { v4 as uuidv4 } from "uuid"; // You'll need to install 'uuid' (npm install uuid @types/uuid)

// Import Components
import Navbar from "@/components/Navbar";
import ScheduleModal from "../components/ScheduleModal";
import RouteCard from "../components/RouteCard";
import {
  ShareLocationButton,
  ShareLocationPanel,
} from "../components/ShareLocationPanel";
import ProximityMessageOverlay, {
  ProximityMessage,
} from "../components/ProximityMessageOverlay"; // Import the new component and type

// Import Types and Constants
import {
  Route,
  SocketInterface,
  LiveServerData,
  THEME_COLOR,
  ALL_ROUTE_DATA,
  routeNames,
} from "../lib/constants";

// Use dynamic import for the map component to ensure it's client-side only
const ShuttleMap = dynamic(() => import("../components/ShuttleMap"), {
  ssr: false,
});

// ====================================================================
// ---- MAIN COMPONENT (Orchestrator) ----
// ====================================================================

export default function HomePage() {
  const { data, socket } = useSocket() as {
    data: LiveServerData | null;
    socket: SocketInterface | null;
  };

  const [routes, setRoutes] = useState<Route[]>([]);
  const [modalRoute, setModalRoute] = useState<string | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);

  // NEW STATE: Messages for the floating overlay
  const [proximityMessages, setProximityMessages] = useState<
    ProximityMessage[]
  >([]);

  // Default to the ID of the 'Kuril' route
  const [routeId, setRouteId] = useState<string>(ALL_ROUTE_DATA["Kuril"].id);
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // --- GEOLOCATION AND SHARING LOGIC (UNCHANGED) ---

  // Fetch Routes from external source
  useEffect(() => {
    getRoutes().then((r) => {
      setRoutes(r || []);
      if (r && r.length > 0) {
        setRouteId(r[0].id.toLowerCase());
      }
    });
  }, []);

  // Clean up geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Stop Sharing - Refactored as a stable function
  const stopSharing = useCallback(() => {
    if (!socket) return;

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    socket.emit("share:stop", {});
    setSharing(false);
  }, [socket]);

  // Start Sharing Location - Refactored as a stable function
  const startSharing = useCallback(() => {
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
  }, [socket, routeId, routes, stopSharing]);

  // Toggle Share Panel or Stop Sharing if already active
  const handleShareButtonClick = () => {
    if (sharing) {
      stopSharing();
    } else {
      setShowSharePanel(!showSharePanel);
    }
  };

  // --- NEW SOCKET LISTENER AND MESSAGE HANDLER ---

  // Function to dismiss a message
  const handleDismissMessage = useCallback((id: string) => {
    setProximityMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  // Effect to listen for proximity messages
  useEffect(() => {
    if (!socket) return;

    const handleProximityMessages = (payload: {
      messages: Omit<ProximityMessage, "id">[];
    }) => {
      // Add a unique ID to each message for React keying and dismissal
      const newMessages: ProximityMessage[] = payload.messages.map((msg) => ({
        ...msg,
        id: uuidv4(), // Use UUID for uniqueness
      }));

      // Update the state with the new messages (the server already limits to max 3)
      setProximityMessages(newMessages);
    };

    // Since the server logic is simplified to emit to all non-sharing users,
    // we listen globally. In a real app, this would be for the user's specific location.
    socket.on("user:proximityMessages", handleProximityMessages);

    return () => {
      socket.off("user:proximityMessages", handleProximityMessages);
    };
  }, [socket]); // Re-run if socket changes

  // --- JSX RENDER ---

  return (
    <main className="w-full max-w-6xl mx-auto font-sans min-h-screen relative">
      <Navbar themeColor={THEME_COLOR} />

      {/* ---- Live Map Section ---- */}
      <section className="mb-10 mt-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 pb-2">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-3"></span>
          **Live Map** 🛰️
        </h2>
        <div className="h-[60vh] rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
          <ShuttleMap routes={routes || []} serverData={data} />
        </div>
      </section>

      <hr className="my-8 border-gray-200" />

      {/* ---- Route Cards Section ---- */}
      <section className="mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 pb-2">
          **Route Information & Live Status** 🚦
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {routeNames.map((routeName) => {
            const routeData = ALL_ROUTE_DATA[routeName];
            const liveData = data ? data[routeData.id] : undefined;

            return (
              <RouteCard
                key={routeName}
                routeName={routeName}
                routeData={routeData}
                liveData={liveData}
                onViewSchedule={setModalRoute}
              />
            );
          })}
        </div>
      </section>

      {/* ---- Schedule Modal (Conditional Rendering) ---- */}
      {modalRoute && ALL_ROUTE_DATA[modalRoute] && (
        <ScheduleModal
          routeName={modalRoute}
          schedules={ALL_ROUTE_DATA[modalRoute].schedules}
          onClose={() => setModalRoute(null)}
        />
      )}

      {/* ---- FLOATING PROXIMITY MESSAGES ---- */}
      <ProximityMessageOverlay
        messages={proximityMessages}
        onDismiss={handleDismissMessage}
      />

      {/* ---- Share Location Controls ---- */}
      <ShareLocationButton sharing={sharing} onClick={handleShareButtonClick} />

      {showSharePanel && !sharing && (
        <ShareLocationPanel
          routes={routes}
          routeId={routeId}
          setRouteId={setRouteId}
          sharing={sharing}
          startSharing={startSharing}
          stopSharing={stopSharing}
          setShowSharePanel={setShowSharePanel}
        />
      )}

      <footer className="text-center text-gray-500 text-sm mt-12 py-4 border-t border-gray-200">
        © {new Date().getFullYear()} UIU Shuttle Tracker. Designed for a better
        commute experience.
      </footer>
    </main>
  );
}
