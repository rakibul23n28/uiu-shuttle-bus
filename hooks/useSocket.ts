"use client";
import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";

// Define a type for the live data if known, otherwise keep 'any'
interface LiveServerData {
  // Structure of data expected from 'buses:update'
  [routeId: string]: {
    route: any;
    position: { lat: number; lng: number } | null;
    eta: number | null;
    sharers: number;
  };
}

export default function useSocket() {
  // Use state for the socket instance to trigger re-renders when connected
  const [socket, setSocket] = useState<Socket | null>(null);
  const [data, setData] = useState<LiveServerData | {}>({});

  useEffect(() => {
    // 1. Establish connection and save instance
    const s = io("http://localhost:4000");
    setSocket(s); // Triggers re-render with the connected socket

    // 2. Set up event listeners
    s.on("buses:update", (payload: LiveServerData) => {
      setData(payload);
    });

    // Optional: Add logging
    s.on("connect", () => console.log("Socket connected:", s.id));
    s.on("disconnect", () => console.log("Socket disconnected"));

    // 3. Cleanup function
    return () => {
      s.off("buses:update");
      s.disconnect();
    };
  }, []); // Empty dependency array ensures it runs only once // Return the state variables

  return { socket, data };
}
