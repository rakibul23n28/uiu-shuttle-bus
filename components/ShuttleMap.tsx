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
import { renderToStaticMarkup } from "react-dom/server";

// ---- Stop Marker (Modern Style) ----
const stopMarkerIcon = (color: string) =>
  new L.DivIcon({
    className: "custom-div-icon",
    html: renderToStaticMarkup(
      <FaMapMarkerAlt className="text-2xl drop-shadow-md" style={{ color }} />
    ),
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

// ---- Bus Marker (Modern Gradient + Pulse) ----
const busMarkerIcon = (color: string, busNumber: string) =>
  new L.DivIcon({
    className: "bus-marker-icon",
    html: renderToStaticMarkup(
      <div className="flex flex-col items-center -mt-5 relative">
        {/* Bus Number Label */}
        <div className="px-2 py-0.5 bg-white bg-opacity-90 text-black text-xs text-center font-bold rounded-full shadow-md absolute -top-7 z-10">
          Bus {busNumber}
        </div>
        {/* Bus Icon with Gradient Pulse */}
        <div
          className="p-2 rounded-full shadow-lg border-2 border-white animate-bounce"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, #ffffff 100%)`,
          }}
        >
          <FaBus className="text-white text-xl drop-shadow-md" />
        </div>
      </div>
    ),
    iconSize: [42, 42],
    iconAnchor: [21, 42],
  });

// ---- University Marker (Modern Flag) ----
const universityIcon = new L.DivIcon({
  className: "custom-div-icon",
  html: renderToStaticMarkup(
    <FaFlagCheckered className="text-3xl text-green-500 drop-shadow-lg" />
  ),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function ShuttleMap({ routes, serverData, center_coords }: any) {
  return (
    <MapContainer
      center={center_coords}
      zoom={13}
      className="rounded-2xl shadow-inner border border-gray-200"
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {routes.map((r: any) => {
        const routeColor = r.color || "#4F46E5";
        const liveRouteData = serverData?.[r.id];
        const buses = liveRouteData?.buses || {};

        return (
          <React.Fragment key={r.id}>
            {/* Route Line */}
            <Polyline
              positions={r.coords.map((c: any) => [c[0], c[1]])}
              pathOptions={{
                color: routeColor,
                weight: 6,
                opacity: Object.keys(buses).length > 0 ? 0.9 : 0.5,
                dashArray: Object.keys(buses).length > 0 ? undefined : "8,12",
                className: "transition-all duration-500",
              }}
            />

            {/* Start Marker */}
            {r.coords.length > 0 && (
              <Marker position={r.coords[0]} icon={stopMarkerIcon(routeColor)}>
                <Popup>
                  <b>{r.name}</b>
                  <p>Start</p>
                </Popup>
              </Marker>
            )}

            {/* End Marker */}
            {r.coords.length > 0 && (
              <Marker
                position={r.coords[r.coords.length - 1]}
                icon={universityIcon}
              >
                <Popup>
                  <b>UIU Campus</b>
                  <p>Destination</p>
                </Popup>
              </Marker>
            )}

            {/* Live Buses */}
            {Object.entries(buses).map(([busNumber, busInfo]: any) => {
              if (!busInfo.position) return null;
              return (
                <Marker
                  key={busNumber}
                  position={[busInfo.position.lat, busInfo.position.lng]}
                  icon={busMarkerIcon(routeColor, busNumber)}
                >
                  <Popup>
                    <div className="font-sans">
                      <h4 className="font-bold text-lg flex items-center gap-2">
                        <FaBus className="text-indigo-500" /> Bus {busNumber}
                      </h4>
                      <hr className="my-1 border-gray-300" />
                      <p>
                        <strong>Sharers:</strong> {busInfo.sharers || 1}
                      </p>
                      <p>
                        <strong>ETA:</strong>{" "}
                        {busInfo.eta
                          ? Math.round(busInfo.eta / 60) + " min"
                          : "Calculating..."}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}
