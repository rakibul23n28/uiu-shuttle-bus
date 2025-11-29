"use client";
import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";

interface LiveServerData {
  [routeId: string]: {
    route: any;
    position: { lat: number; lng: number } | null;
    eta: number | null;
    sharers: number;
  };
}

export default function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [data, setData] = useState<LiveServerData | {}>({});

  useEffect(() => {
    // Use environment variable if defined, fallback to localhost
    const BACKEND_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

    const s = io(BACKEND_URL);
    setSocket(s);

    s.on("buses:update", (payload: LiveServerData) => {
      setData(payload);
    });

    s.on("connect", () => console.log("Socket connected:", s.id));
    s.on("disconnect", () => console.log("Socket disconnected"));

    return () => {
      s.off("buses:update");
      s.disconnect();
    };
  }, []);

  return { socket, data };
}
