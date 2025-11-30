import React from "react";
import {
  HiUser,
  HiPhone,
  HiClock,
  HiTruck,
  HiXCircle,
  HiStop,
} from "react-icons/hi";
import { RouteData, ServerRouteData, ACCENT_COLOR } from "../lib/constants";

// --- Helper function to render the live status UI (Moved from HomePage) ---
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
          ETA: {isRunning && etaMinutes !== null ? `${etaMinutes} min` : "N/A"}
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

interface RouteCardProps {
  routeName: string;
  routeData: RouteData;
  liveData: ServerRouteData | undefined;
  onViewSchedule: (name: string) => void;
}

export default function RouteCard({
  routeName,
  routeData,
  liveData,
  onViewSchedule,
}: RouteCardProps) {
  return (
    <div
      key={routeName}
      className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-indigo-500 hover:shadow-2xl hover:scale-[1.02] transform transition-all duration-300 overflow-hidden group"
    >
      <h3 className="text-gray-900 font-bold text-xl mb-3 flex items-center">
        <span className={`text-[${ACCENT_COLOR}] mr-2`}>📍</span>
        **{routeName}**
      </h3>

      {/* LIVE STATUS */}
      {renderLiveStatus(liveData)}
      <hr className="my-4 border-gray-100" />
      {/* END LIVE STATUS */}

      <div className="space-y-3 mb-4 text-gray-700 text-sm">
        <div className="flex items-center gap-2">
          <HiUser className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold">
            Supervisor: **{routeData.supervisor.name}**
          </span>
        </div>

        <div className="flex items-center gap-2">
          <HiPhone className="h-5 w-5 text-indigo-500" />
          <span>Contact: **{routeData.supervisor.contact}**</span>
        </div>
      </div>

      <button
        onClick={() => onViewSchedule(routeName)}
        className={`w-full py-3 mt-2 rounded-xl text-white font-bold text-base bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:bg-indigo-800`}
      >
        View Schedule
      </button>
    </div>
  );
}
