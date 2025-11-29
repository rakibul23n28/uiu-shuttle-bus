"use client";

import React from "react";
import { FaBusSimple, FaHouse } from "react-icons/fa6";

// --- Types ---
interface NavbarProps {
  themeColor: string;
}

// Define common Tailwind classes for theme usage
const THEME_ACCENT_CLASSES = "bg-indigo-600 hover:bg-indigo-700";

// --- Navbar Component ---
const Navbar: React.FC<NavbarProps> = ({ themeColor }) => {
  // Use the themeColor or a solid default for styling
  const ACCENT_COLOR = themeColor || "#4F46E5";

  return (
    <nav className="w-full px-0 py-3 mb-6">
      <div
        className={`flex items-center justify-between p-4 sm:p-5 rounded-xl shadow-xl transition-all duration-300 border-2 border-[${ACCENT_COLOR}] bg-white`}
      >
        {/* Left Side: Logo and Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo/Icon */}
          <FaBusSimple
            className="text-3xl sm:text-4xl transition-colors"
            style={{ color: ACCENT_COLOR }}
          />

          {/* Title */}
          <div className="font-extrabold text-xl sm:text-3xl text-gray-900 tracking-tight leading-none">
            UIU Shuttle **Tracker**
          </div>
        </div>

        {/* Right Side: Navigation/Action */}
        <div className="flex items-center">
          {/* Home Button (using theme color for primary action) */}
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md text-white`}
            // Dynamically applying background color based on themeColor prop
            style={{
              backgroundColor: ACCENT_COLOR,
              // Add hover style directly via an inline style workaround for themeColor interpolation
              // Note: In a real Next/Tailwind project, use a CSS variable or dynamic class loading.
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#3730A3")
            } // Darker Indigo-700
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = ACCENT_COLOR)
            }
          >
            <FaHouse className="w-4 h-4" />
            Home
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
