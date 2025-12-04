"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { THEME_COLOR, routeNames, Route } from "../lib/constants";
import { getRoutes } from "../lib/routes";
import Navbar from "@/components/Navbar";

type RouteKey = keyof typeof routeNames;

export default function HomePage() {
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    getRoutes().then((r) => setRoutes(r || []));
  }, []);

  const generateRouteSlug = (name: string): string =>
    encodeURIComponent(name.toLowerCase());

  return (
    <main className="w-full max-w-6xl mx-auto font-sans min-h-screen relative p-4 sm:p-6 lg:p-8">
      <Navbar themeColor={THEME_COLOR} />

      <hr className="my-10 border-blue-200" />

      {/* Route Cards */}
      <section className="mb-10">
        <h2
          className="text-3xl font-extrabold text-gray-900 mb-8 pb-3 border-b-4 
                       border-gradient-to-r from-blue-400 via-blue-500 to-blue-600"
        >
          Explore Available Shuttle Routes 🗺️
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {routeNames.map((routeName, idx) => {
            const routeSlug = generateRouteSlug(routeName);

            // Optional: Different clip-path shapes for each card
            const clipPaths = [
              "polygon(0% 0%, 100% 0%, 90% 100%, 0% 90%)",
              "polygon(0% 0%, 100% 10%, 100% 100%, 10% 100%)",
              "polygon(10% 0%, 100% 0%, 90% 100%, 0% 90%)",
              "polygon(0% 10%, 100% 0%, 100% 90%, 0% 100%)",
            ];
            const clipPath = clipPaths[idx % clipPaths.length];

            return (
              <Link
                key={routeName}
                href={`/route/${routeSlug}`}
                passHref
                className="group block"
              >
                <div
                  className="relative p-6 bg-gradient-to-br from-white via-blue-50 to-white
                             shadow-md hover:shadow-2xl border-2 border-transparent hover:border-blue-400
                             transition-transform duration-300 transform hover:-translate-y-2 hover:scale-105"
                  style={{ clipPath }}
                >
                  {/* Decorative corner shapes */}
                  <span className="absolute top-0 right-0 w-6 h-6 bg-blue-400 rounded-bl-full opacity-40"></span>
                  <span className="absolute bottom-0 left-0 w-8 h-8 bg-blue-300 rounded-tr-full opacity-30"></span>

                  <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-700 transition mb-2">
                    {routeName}
                  </h3>

                  <span className="inline-block text-xs font-semibold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full mb-3">
                    UIU Route
                  </span>

                  <p className="text-sm text-gray-500">
                    View Live Map & Schedule Details
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="text-center text-gray-500 text-sm mt-12 py-4 border-t border-gray-200">
        © {new Date().getFullYear()} UIU Shuttle Tracker. Designed for a better
        commute experience.
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
