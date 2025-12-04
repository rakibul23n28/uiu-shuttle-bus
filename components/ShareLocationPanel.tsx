import React from "react";
import { HiLocationMarker, HiX } from "react-icons/hi";
import { Route, ACCENT_COLOR } from "../lib/constants";

// Updated Interface: setRouteId must accept an ID and will handle persistence
interface ShareLocationPanelProps {
  routes: Route[];
  routeId: string;
  setRouteId: (id: string) => void;
  sharing: boolean;
  busNumber: string;
  setBusNumber: (busNumber: string) => void;
  startSharing: () => void;
  stopSharing: () => void;
  setShowSharePanel: (show: boolean) => void;
}

// Floating Share Location Button - REMOVED (Logic moved to DedicatedRoutePage for simplicity)

// Share Location Panel
export function ShareLocationPanel({
  routes,
  routeId,
  setRouteId,
  sharing,
  busNumber,
  setBusNumber,
  startSharing,
  stopSharing,
  setShowSharePanel,
}: ShareLocationPanelProps) {
  const currentRouteName =
    routes.find((r) => r.id === routeId)?.name || routeId;

  return (
    <div className="fixed bottom-16 right-4 w-80 sm:w-96 z-50 rounded-3xl bg-white shadow-2xl p-5 backdrop-blur-md border border-gray-200 animate-slide-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
          Share Your Location 📍
        </h3>
        <button
          onClick={() => setShowSharePanel(false)}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <HiX className="h-6 w-6" />
        </button>
      </div>

      {/* Info */}
      <p className="text-sm text-gray-600 mb-4 bg-indigo-50/50 p-2 rounded-lg">
        💡 Activate this when you are on the shuttle bus to share your location
        live. **Your selection will be remembered.**
      </p>

      {/* Bus Number Picker */}
      <label className="block text-gray-700 font-medium mb-2">
        Select Bus Number:
      </label>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            onClick={() => setBusNumber(String(num))}
            className={`py-2 rounded-lg border text-sm font-semibold transition ${
              busNumber === String(num)
                ? "bg-indigo-500 text-white border-indigo-500"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Route Selector */}
      <label className="block text-gray-700 font-medium mb-2">
        Select Route:
      </label>

      <select
        value={routeId}
        // Use the updated setRouteId function
        onChange={(e) => setRouteId(e.target.value)}
        className="w-full p-3 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
      >
        {routes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {/* Action Button */}
      <button
        onClick={!sharing ? startSharing : stopSharing}
        className={`w-full py-3 rounded-xl font-bold text-white transition transform hover:scale-105 ${
          !sharing
            ? "bg-green-500 hover:bg-green-600"
            : "bg-red-500 hover:bg-red-600"
        }`}
      >
        {!sharing ? "Start Live Tracking" : "Stop Tracking"}
      </button>

      {/* Status */}
      {sharing && (
        <p className="text-center text-sm mt-3 text-green-600 font-semibold">
          🔔 Live sharing active on route: {currentRouteName} – Bus {busNumber}
        </p>
      )}
    </div>
  );
}
