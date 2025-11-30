// ====================================================================
// ---- TYPES & CONSTANTS ----
// ====================================================================

export interface SocketInterface {
  emit: (event: string, data: any) => void;
  // FIX: Added 'on' and 'off' methods to match Socket.IO client
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

export interface Route {
  id: string;
  name: string;
  color?: string;
}

export interface Position {
  lat: number;
  lng: number;
}

export interface ServerRouteData {
  route: Route;
  position: Position | null;
  eta: number | null; // Estimated Time of Arrival in seconds
  sharers: number;
}

// Map from routeId to ServerRouteData
export interface LiveServerData {
  [key: string]: ServerRouteData;
}

export interface Schedule {
  from: string;
  to: string;
  times: string[];
  offDays?: string;
}

export type Direction = "fromUIU" | "toUIU";

export interface RouteSchedules {
  fromUIU: Schedule;
  toUIU: Schedule;
}

export interface Supervisor {
  name: string;
  contact: string;
}

export interface RouteData {
  schedules: RouteSchedules;
  supervisor: Supervisor;
  id: string; // Route ID for the server (e.g., 'kuril')
}

// Define colors for better UI theme consistency
export const THEME_COLOR = "#4F46E5"; // Indigo-600
export const ACCENT_COLOR = "#F68B1F"; // Original Orange

// ====================================================================
// ---- CONSOLIDATED DATA ----
// ====================================================================

export const ALL_ROUTE_DATA: Record<string, RouteData> = {
  Aftab: {
    id: "aftab",
    supervisor: { name: "Mr. Rahim", contact: "+880-170-0000001" },
    schedules: {
      fromUIU: {
        from: "UIU",
        to: "Aftab",
        times: ["02:00 PM", "03:20 PM", "04:40 PM - 06:00 PM"],
        offDays: "Thursday, Friday",
      },
      toUIU: {
        from: "Aftab",
        to: "UIU",
        times: ["06:50 AM- 09:00 AM", "10:30 AM", "11:50 AM", "01:10 PM"],
      },
    },
  },
  "Notun Bazar": {
    id: "notun",
    supervisor: { name: "Mr. Rahim", contact: "+880-170-0000001" },
    schedules: {
      fromUIU: {
        from: "UIU",
        to: "Notun Bazar",
        times: [
          "10:05 AM",
          "11:25 AM",
          "12:45 PM",
          "02:05 PM",
          "03:25 PM",
          "04:40 PM",
          "06:10 PM",
          "05:45 PM",
          "07:00 PM",
          "09:40 PM",
        ],
        offDays: "Friday",
      },
      toUIU: {
        from: "Notun Bazar",
        to: "UIU",
        times: [
          "07:30 AM- 08:45 AM",
          "09:25 AM- 09:35 AM",
          "10:45 AM- 10:55 AM",
          "12:05 PM- 12:15 PM",
          "01:25 PM- 01:35 PM",
          "02:45 PM- 02:55 PM",
          "09:40 PM",
        ],
      },
    },
  },
  Kuril: {
    id: "kuril",
    supervisor: { name: "Mr. Rahim", contact: "+880-170-0000001" },
    schedules: {
      fromUIU: {
        from: "UIU",
        to: "Kuril",
        times: ["11:10 AM", "01:40 PM", "04:10 PM"],
        offDays: "Saturday",
      },
      toUIU: {
        from: "Kuril",
        to: "UIU",
        times: [
          "07:30 AM - 8:40 AM",
          "10:00 AM - 11:10 AM",
          "12:30 PM - 1:40 PM",
        ],
      },
    },
  },
};

export const routeNames = Object.keys(ALL_ROUTE_DATA);
