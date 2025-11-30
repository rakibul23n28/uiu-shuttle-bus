"use client";

import React, { useState, useEffect } from "react";
import { FaBusSimple, FaHouse } from "react-icons/fa6";
import {
  FaCloudSun,
  FaClock,
  FaCalendarAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

// --- Props ---
interface NavbarProps {
  themeColor: string;
}

// --- TimeWeatherControl ---
const TimeWeatherControl: React.FC = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = dateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const dateString = dateTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const weatherData = {
    temperature: "27°C",
    condition: "Partly Cloudy",
    icon: FaCloudSun,
    location: "Dhaka, BD",
  };
  const WeatherIcon = weatherData.icon;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 p-3 rounded-2xl shadow-xl border border-gray-200 w-48 sm:w-56 font-sans">
      {/* Location */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <FaMapMarkerAlt className="text-red-500 w-4 h-4 animate-pulse" />
        <span className="text-xs font-semibold text-gray-700">
          {weatherData.location}
        </span>
      </div>

      {/* Time & Date */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="flex flex-col items-center bg-indigo-50 p-2 rounded-xl shadow-sm hover:scale-105 transition-transform">
          <FaClock className="text-indigo-500 mb-1 animate-pulse" />
          <span className="text-sm font-bold text-gray-800">{timeString}</span>
          <span className="text-[10px] text-gray-500 mt-0.5">Time</span>
        </div>

        <div className="flex flex-col items-center bg-indigo-50 p-2 rounded-xl shadow-sm hover:scale-105 transition-transform">
          <FaCalendarAlt className="text-indigo-500 mb-1 animate-pulse" />
          <span className="text-sm font-bold text-gray-800">{dateString}</span>
          <span className="text-[10px] text-gray-500 mt-0.5">Date</span>
        </div>
      </div>

      {/* Weather */}
      <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all">
        <WeatherIcon className="text-blue-500 w-6 h-6 animate-bounce" />
        <div className="flex flex-col items-start">
          <span className="font-bold text-gray-800 text-sm">
            {weatherData.temperature}
          </span>
          <span className="text-[10px] text-gray-600">
            {weatherData.condition}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Navbar ---
const Navbar: React.FC<NavbarProps> = ({ themeColor }) => {
  const ACCENT_COLOR = themeColor || "#4F46E5";

  return (
    <nav className="w-full px-4 py-3 mb-6">
      <div
        className={`flex flex-col sm:flex-row items-center sm:justify-between p-4 sm:p-5 rounded-2xl shadow-xl transition-all duration-300 border-2 border-[${ACCENT_COLOR}] bg-white gap-4 sm:gap-0`}
      >
        {/* Left Side: Logo & Title */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          {/* Logo with gradient background */}
          <div
            className="p-2 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg hover:scale-105 transition-transform cursor-pointer"
            style={{
              width: "50px",
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FaBusSimple className="text-white text-2xl sm:text-3xl" />
          </div>

          {/* Title & Subtitle */}
          <div className="flex flex-col items-center sm:items-start">
            <span className="font-extrabold text-lg sm:text-2xl text-gray-900 tracking-tight leading-none">
              UIU Shuttle
            </span>
            <span className="text-sm sm:text-base font-semibold text-indigo-600">
              Tracker Dashboard
            </span>
          </div>
        </div>

        {/* Right Side: TimeWeatherControl & Home Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <TimeWeatherControl />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
