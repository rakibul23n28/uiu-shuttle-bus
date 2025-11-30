import React from "react";
import { HiLocationMarker, HiX } from "react-icons/hi";
import { Route, ACCENT_COLOR } from "../lib/constants";

interface ShareLocationPanelProps {
  routes: Route[];
  routeId: string;
  setRouteId: (id: string) => void;
  sharing: boolean;
  startSharing: () => void;
  stopSharing: () => void;
  setShowSharePanel: (show: boolean) => void;
}

export function ShareLocationButton({
  sharing,
  onClick,
}: {
  sharing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-8 right-8 z-50 transition-all duration-300 text-white px-3 py-2 rounded-full shadow-xl text-lg font-semibold flex items-center space-x-2 ${
        sharing ? "bg-red-500 hover:bg-red-600" : "hover:bg-[#D47113]"
      }`}
      style={{ backgroundColor: sharing ? "#ef4444" : ACCENT_COLOR }}
    >
      <HiLocationMarker className="h-6 w-6" />
      <span>{sharing ? "Sharing Live" : "Share Location"}</span>
    </button>
  );
}

export function ShareLocationPanel({
  routes,
  routeId,
  setRouteId,
  sharing,
  startSharing,
  stopSharing,
  setShowSharePanel,
}: ShareLocationPanelProps) {
  const currentRouteName =
    routes.find((r) => r.id === routeId)?.name || routeId;

  return (
    <div className="fixed bottom-20 right-4 w-72 sm:w-80 bg-white rounded-2xl shadow-xl p-3 sm:p-5 z-50 border-t-4 border-indigo-500 animate-slide-in">
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h3 className="font-bold text-lg sm:text-xl text-gray-800">
          **Start Sharing** 📢
        </h3>
        <button
          className="text-gray-400 hover:text-red-500 text-lg sm:text-xl font-bold transition"
          onClick={() => setShowSharePanel(false)}
          aria-label="Close share panel"
        >
          <HiX />
        </button>
      </div>

      <p className="text-xs sm:text-sm mt-1 sm:mt-2 text-indigo-700 bg-indigo-50 p-1 sm:p-2 rounded-lg font-medium">
        💡 **When You are in a Shuttle Bus.**
      </p>

      <label
        htmlFor="route-select"
        className="block text-gray-700 mt-2 sm:mt-4 mb-1 sm:mb-2 font-medium text-sm"
      >
        Select Route:
      </label>

      <select
        id="route-select"
        value={routeId}
        onChange={(e) => setRouteId(e.target.value)}
        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
      >
        {routes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <button
        onClick={!sharing ? startSharing : stopSharing}
        className={`w-full py-2 sm:py-3 mt-3 sm:mt-4 rounded-lg text-white font-bold text-sm sm:text-base shadow-md transition-all ${
          !sharing
            ? "bg-emerald-500 hover:bg-emerald-600"
            : "bg-rose-500 hover:bg-rose-600"
        }`}
      >
        {!sharing ? "Activate Live Tracker" : "Stop Tracking"}
      </button>

      {/* Status Message */}
      {sharing && (
        <p className="text-center text-xs sm:text-sm mt-2 text-emerald-700 font-semibold">
          Location is being shared live on route **{currentRouteName}**.
        </p>
      )}
    </div>
  );
}
