"use client";
import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaBus, FaFlagCheckered, FaMapMarkerAlt } from "react-icons/fa";

// Import the correct static rendering function
import { renderToStaticMarkup } from "react-dom/server";

// Define the central coordinates (UIU location)
const CENTER_COORDS: [number, number] = [23.799000502105223, 90.43751857157083];

// 1. Custom Icon Definitions
// --- START/END MARKERS (Simple Pin) ---
const stopMarkerIcon = (color: string) =>
  new L.DivIcon({
    className: "custom-div-icon",
    html: renderToStaticMarkup(
      <FaMapMarkerAlt className="text-2xl" style={{ color: color }} />
    ),
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -20],
  });

// --- LIVE BUS MARKER (Bus Icon) ---
const busMarkerIcon = (color: string) =>
  new L.DivIcon({
    className: "bus-marker-icon animate-pulse",
    html: renderToStaticMarkup(
      <div
        className="p-2 rounded-full shadow-lg border-2 border-white"
        style={{ backgroundColor: color }}
      >
        <FaBus className="text-white text-xl" />
      </div>
    ),
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

// --- UIU/END MARKER (Checkered Flag) ---
const universityIcon = new L.DivIcon({
  className: "custom-div-icon",
  html: renderToStaticMarkup(
    <FaFlagCheckered className="text-3xl text-green-600" />
  ),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// REMOVED: TimeWeatherControl component (Moved to Navbar)
// REMOVED: MapContextualControls component (No longer needed)

// 4. Main Map Component
export default function ShuttleMap({ routes, serverData }: any) {
  return (
    <MapContainer
      center={CENTER_COORDS}
      zoom={13}
      className="rounded-xl shadow-inner border border-gray-200"
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* REMOVED: <MapContextualControls /> */}

      {routes.map((r: any) => {
        const routeColor = r.color || "#4F46E5";
        const liveData = serverData && serverData[r.id];
        const isBusActive = liveData && liveData.position;

        return (
          <React.Fragment key={r.id}>
            {/* Polyline for route */}
            <Polyline
              positions={r.coords.map((c: any) => [c[0], c[1]])}
              pathOptions={{
                color: routeColor,
                weight: 6,
                opacity: isBusActive ? 0.9 : 0.6,
                dashArray: isBusActive ? undefined : "5, 10",
              }}
            />

            {/* START Marker (Away from UIU) */}
            {r.coords.length > 0 && (
              <Marker position={r.coords[0]} icon={stopMarkerIcon(routeColor)}>
                <Popup>
                  <div className="font-semibold text-center">
                    <p className="text-lg text-indigo-700">{r.name}</p>
                    <p className="text-sm text-gray-500">Starting Point</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* END Marker (UIU) */}
            {r.coords.length > 0 && (
              <Marker
                position={r.coords[r.coords.length - 1]}
                icon={universityIcon}
              >
                <Popup>
                  <div className="font-semibold text-center">
                    <p className="text-lg text-green-700">UIU Campus</p>
                    <p className="text-sm text-gray-500">
                      Destination/Drop-off Point
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Live bus marker */}
            {isBusActive && (
              <Marker
                position={[liveData.position.lat, liveData.position.lng]}
                icon={busMarkerIcon(routeColor)}
              >
                <Popup>
                  <div className="p-1 font-sans">
                    <h4 className="font-bold text-lg text-center text-gray-900 mb-1 flex items-center justify-center">
                      <FaBus className="mr-2 text-indigo-500" /> **Live Bus:{" "}
                      {r.name}**
                    </h4>
                    <hr className="my-1" />
                    <div className="text-sm space-y-1">
                      <p>
                        <strong className="text-gray-600">Sharers:</strong>{" "}
                        {liveData.sharers || 1}
                      </p>
                      <p>
                        <strong className="text-gray-600">ETA to UIU:</strong>{" "}
                        <span className="font-extrabold text-green-600">
                          {liveData.eta
                            ? Math.round(liveData.eta / 60) + " min"
                            : "Calculating..."}
                        </span>
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}
