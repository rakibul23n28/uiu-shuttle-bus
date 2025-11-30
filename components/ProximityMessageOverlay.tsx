// components/ProximityMessageOverlay.tsx
import React from "react";
import { HiX, HiBell, HiLocationMarker } from "react-icons/hi"; // CHANGED: HiBellAlert -> HiBell

// Define the type for the messages received from the server
export interface ProximityMessage {
  routeId: string;
  text: string;
  priority: number;
  id: string; // Unique ID for keying/dismissal
}

interface ProximityMessageOverlayProps {
  messages: ProximityMessage[];
  onDismiss: (id: string) => void;
}

export default function ProximityMessageOverlay({
  messages,
  onDismiss,
}: ProximityMessageOverlayProps) {
  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col space-y-3 pointer-events-none">
      {messages.map((message) => (
        <div
          key={message.id}
          className="relative bg-white p-4 rounded-xl shadow-2xl border-l-4 border-yellow-500 max-w-xs transition-all duration-300 transform translate-x-0 opacity-100 pointer-events-auto hover:shadow-lg"
        >
          {/* Dismiss Button */}
          <button
            onClick={() => onDismiss(message.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition p-1 rounded-full bg-gray-50 hover:bg-red-50"
            aria-label="Dismiss message"
          >
            <HiX className="h-4 w-4" />
          </button>

          <div className="flex items-start">
            <HiBell className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />{" "}
            {/* CHANGED: HiBellAlert -> HiBell */}
            <div className="text-sm">
              <p className="font-bold text-gray-800 flex items-center mb-1">
                <HiLocationMarker className="h-4 w-4 mr-1 text-indigo-600" />
                Proximity Alert
              </p>
              {/* Using dangerouslySetInnerHTML to render bold text from server payload */}
              <p
                className="text-gray-600"
                dangerouslySetInnerHTML={{ __html: message.text }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
