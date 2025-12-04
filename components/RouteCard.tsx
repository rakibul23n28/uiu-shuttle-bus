"use client";
import React from "react";
import {
  HiUser,
  HiPhone,
  HiClock,
  HiTruck,
  HiXCircle,
  HiStop,
  HiOutlineLightningBolt, // Added for next trip highlight
} from "react-icons/hi";
import { RouteData, ServerRouteData, ACCENT_COLOR } from "../lib/constants";
import { findNextTrip } from "../lib/timeUtils"; // Assuming this utility is available

// ====================================================================
// ---- HELPER FUNCTION: LIVE STATUS RENDERER ----
// ====================================================================
// (This function remains largely the same as in the original code block)
const renderLiveStatus = (liveData: ServerRouteData | undefined) => {
  if (
    !liveData ||
    !liveData.buses ||
    Object.keys(liveData.buses).length === 0
  ) {
    return (
      <div className="flex items-center gap-2 text-gray-500 bg-gray-100 p-2 rounded-lg text-sm font-semibold">
        <HiXCircle className="h-5 w-5" />
        <span>No Live Tracking</span>
      </div>
    );
  }

  type BusData = {
    position: { lat: number; lng: number } | null;
    sharers: number;
    eta: number | null;
  };

  const buses = liveData.buses;
  const firstBus = Object.values(buses)[0] as BusData | undefined;

  if (!firstBus) {
    return (
      <div className="flex items-center gap-2 text-gray-500 bg-gray-100 p-2 rounded-lg text-sm font-semibold">
        <HiXCircle className="h-5 w-5" />
        <span>No Live Tracking</span>
      </div>
    );
  }

  const isRunning = firstBus.position !== null && firstBus.sharers > 0;
  const etaMinutes = firstBus.eta ? Math.ceil(firstBus.eta / 60) : null;

  let statusText, statusColor, StatusIcon;

  if (isRunning) {
    statusText = "Bus Live";
    statusColor = "text-green-600";
    StatusIcon = HiTruck;
  } else if (firstBus.sharers > 0) {
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
      <div
        className={`flex items-center justify-center gap-2 p-2 rounded-lg bg-white shadow-sm border border-gray-100 ${statusColor}`}
      >
        <StatusIcon className="h-5 w-5 font-bold" />
        <span className="text-sm font-extrabold">{statusText}</span>
      </div>

      <div
        className={`flex items-center justify-center gap-2 p-2 rounded-lg bg-white shadow-sm border border-gray-100 ${
          isRunning ? "text-indigo-600" : "text-gray-500"
        }`}
      >
        <HiClock className="h-5 w-5" />
        <span className="text-sm font-semibold">
          ETA: {isRunning && etaMinutes !== null ? `${etaMinutes} min` : "N/A"}
        </span>
      </div>

      <div className="col-span-2 flex items-center justify-center gap-2 p-2 rounded-lg bg-white shadow-sm border border-gray-100 text-gray-700">
        <HiUser className="h-5 w-5 text-purple-500" />
        <span className="text-sm font-semibold">
          Sharers: {firstBus.sharers || 0} on Route
        </span>
      </div>
    </div>
  );
};

// ====================================================================
// ---- HELPER FUNCTION: SCHEDULE DETAILS EXTRACTOR ----
// ====================================================================
const getScheduleDetails = (routeData: RouteData) => {
  const nextTripFromUIU = findNextTrip(routeData.schedules.fromUIU.times);
  const nextTripToUIU = findNextTrip(routeData.schedules.toUIU.times);

  return {
    nextTripFromUIU,
    nextTripToUIU,
    fromUIUOffDays: routeData.schedules.fromUIU.offDays,
  };
};

// ====================================================================
// ---- COMPONENT INTERFACE ----
// ====================================================================
interface RouteCardProps {
  routeName: string;
  routeData: RouteData;
  liveData: ServerRouteData | undefined;
  onViewSchedule: (name: string) => void;
}

// ====================================================================
// ---- MAIN COMPONENT ----
// ====================================================================
export default function RouteCard({
  routeName,
  routeData,
  liveData,
  onViewSchedule,
}: RouteCardProps) {
  const { nextTripFromUIU, nextTripToUIU, fromUIUOffDays } =
    getScheduleDetails(routeData);

  return (
    <div
      key={routeName}
      className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-indigo-500 hover:shadow-2xl hover:scale-[1.02] transform transition-all duration-300 overflow-hidden group"
    >
      <h3 className="text-gray-900 font-bold text-2xl mb-4 flex items-center">
        <span style={{ color: ACCENT_COLOR }} className="mr-3 text-3xl">
          📍
        </span>
        {routeName}
      </h3>

      {/* LIVE STATUS */}
      {renderLiveStatus(liveData)}
      <hr className="my-5 border-gray-200" />

      {/* NEXT SCHEDULE TIME */}
      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
        <HiOutlineLightningBolt className="h-6 w-6 mr-2 text-yellow-500" />
        Next Departures:
      </h4>
      <div className="space-y-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
        <NextTripDisplay label={`UIU → ${routeName}`} time={nextTripFromUIU} />
        <NextTripDisplay label={`${routeName} → UIU`} time={nextTripToUIU} />
      </div>

      {fromUIUOffDays && (
        <p className="mt-4 text-center text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg">
          Service Suspended on: **{fromUIUOffDays}**
        </p>
      )}

      <hr className="my-5 border-gray-200" />

      {/* SUPERVISOR INFO */}
      <div className="space-y-3 mb-4 text-gray-700 text-sm">
        <div className="flex items-center gap-2">
          <HiUser className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold">
            Supervisor: **{routeData.supervisor.name}**
          </span>
        </div>

        <div className="flex items-center gap-2">
          <HiPhone className="h-5 w-5 text-indigo-500" />
          <span>Contact: {routeData.supervisor.contact}</span>
        </div>
      </div>

      {/* VIEW SCHEDULE BUTTON */}
      <button
        onClick={() => onViewSchedule(routeName)}
        className="w-full py-3 mt-4 rounded-xl text-white font-bold text-base bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:bg-indigo-800"
      >
        View All Schedules
      </button>
    </div>
  );
}

// ====================================================================
// ---- SUB-COMPONENT: NEXT TRIP DISPLAY ----
// ====================================================================
interface NextTripDisplayProps {
  label: string;
  time: string | null;
}

const NextTripDisplay = ({ label, time }: NextTripDisplayProps) => (
  <div className="flex justify-between items-center text-sm font-semibold">
    <span className="text-gray-600">{label}:</span>
    {time ? (
      <span className="text-green-700 font-extrabold text-base bg-green-100 py-1 px-3 rounded-full">
        {time}
      </span>
    ) : (
      <span className="text-red-500 font-bold bg-red-100 py-1 px-3 rounded-full">
        No more trips today
      </span>
    )}
  </div>
);
