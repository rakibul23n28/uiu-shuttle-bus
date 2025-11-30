import React, { useState } from "react";
import {
  HiX,
  HiChevronRight,
  HiOutlineLightningBolt,
  HiClock,
  HiCalendar,
} from "react-icons/hi";
import { Direction, RouteSchedules, THEME_COLOR } from "../lib/constants";
import { findNextTrip } from "../lib/timeUtils";

// ====================================================================
// ---- SCHEDULE MODAL COMPONENT ----
// ====================================================================

interface ScheduleModalProps {
  routeName: string;
  schedules: RouteSchedules;
  onClose: () => void;
}

export default function ScheduleModal({
  routeName,
  schedules,
  onClose,
}: ScheduleModalProps) {
  const [activeTab, setActiveTab] = useState<Direction>("fromUIU");
  const scheduleData = schedules[activeTab];
  const nextTripTime = findNextTrip(scheduleData.times);

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center p-4 z-50 backdrop-blur-sm overflow-auto">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-8 relative shadow-2xl transform scale-100 transition-transform duration-300
        max-h-[90vh] overflow-y-auto"
      >
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
          🚌 **{routeName} Schedule**
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
              Next Available Trip: **{nextTripTime}**
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
