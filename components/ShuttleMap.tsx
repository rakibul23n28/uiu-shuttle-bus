"use client";
import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  FaBus,
  FaFlagCheckered,
  FaMapMarkerAlt,
  FaCloudSun,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";

// Import the correct static rendering function
import { renderToStaticMarkup } from "react-dom/server";

// Import the client-side renderer for the dynamic control
import { createRoot } from "react-dom/client";

// Define the central coordinates (UIU location)
const CENTER_COORDS: [number, number] = [23.797772120634306, 90.44984557332447];

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

// 2. Component for Time/Weather Overlay (Made smaller)
function TimeWeatherControl() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = dateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const dateString = dateTime.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Placeholder data based on current context
  const weatherData = {
    temperature: "27°C",
    condition: "Partly Cloudy",
    icon: FaCloudSun,
    location: "Dhaka, BD",
  };
  const WeatherIcon = weatherData.icon;

  return (
    // ADJUSTMENTS: Reduced max-width to 140px, reduced padding (p-1.5)
    <div className=" p-1.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-l-4 border-indigo-500 -mr-2 -mt-2 max-w-[140px] sm:max-w-[200px] font-sans">
      <h3 className="text-[10px] font-bold text-gray-700 mb-1 flex items-center justify-center text-center">
        {/* Reduced icon size and margin */}
        <FaMapMarkerAlt className="mr-1 text-red-500 w-2.5 h-2.5" />{" "}
        {weatherData.location} Status
      </h3>

      {/* Reduced gap and text size */}
      <div className="grid grid-cols-2 gap-0.5 text-[9px]">
        {/* Time */}
        <div className="flex flex-col items-center justify-center p-1 bg-gray-100 rounded-md">
          <FaClock className="text-xs text-indigo-600 mb-0.5" />
          {/* Reduced font size to xs */}
          <span className="font-extrabold text-xs text-gray-800">
            {timeString}
          </span>
          <span className="text-gray-500 mt-0.5 text-[8px]">Time</span>
        </div>

        {/* Date */}
        <div className="flex flex-col items-center justify-center p-1 bg-gray-100 rounded-md">
          <FaCalendarAlt className="text-xs text-indigo-600 mb-0.5" />
          {/* Reduced font size to xs */}
          <span className="font-extrabold text-xs text-gray-800">
            {dateString}
          </span>
          <span className="text-gray-500 mt-0.5 text-[8px]">Date</span>
        </div>

        {/* Weather */}
        {/* Reduced padding and icon/text size */}
        <div className="col-span-2 flex items-center justify-center p-1.5 mt-1 bg-blue-50 rounded-md border border-blue-200">
          <WeatherIcon className="text-xl text-blue-500 mr-2" />
          <div>
            <span className="text-sm font-extrabold text-gray-800">
              {weatherData.temperature}
            </span>
            <p className="text-gray-600 text-[8px]">{weatherData.condition}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Map Control Hook to inject the React component client-side
function MapContextualControls() {
  const map = useMap();
  const controlRef = React.useRef<L.Control | null>(null);

  useEffect(() => {
    if (!controlRef.current) {
      const Control = L.Control.extend({
        onAdd: function (map: L.Map) {
          const container = L.DomUtil.create("div");
          L.DomEvent.disableClickPropagation(container);

          // Use createRoot for client-side rendering
          const root = createRoot(container);
          root.render(<TimeWeatherControl />);

          // Attach root instance to the container for later cleanup
          (container as any)._reactRoot = root;
          return container;
        },
        onRemove: function (map: L.Map) {
          // Clean up the React component when the control is removed
          const container = (controlRef.current as any).getContainer();
          if ((container as any)._reactRoot) {
            (container as any)._reactRoot.unmount();
          }
        },
      });

      controlRef.current = new Control({ position: "topright" });
      controlRef.current.addTo(map);
    }

    // Cleanup function for when the hook or component unmounts
    return () => {
      if (controlRef.current) {
        controlRef.current.remove();
        controlRef.current = null;
      }
    };
  }, [map]);

  return null;
}

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

      {/* Inject the custom time/weather control */}
      <MapContextualControls />

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
