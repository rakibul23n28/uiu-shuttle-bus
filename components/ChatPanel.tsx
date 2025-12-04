"use client";
import React, { useState, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";
import { useRouteChat, Message } from "@/hooks/useRouteChat";
import { FaPaperPlane } from "react-icons/fa";

interface ChatPanelProps {
  socket: Socket | null;
  routeId: string;
  user: string;
  chatName: string;
  onClose: () => void;
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function ChatPanel({
  socket,
  routeId,
  user,
  chatName,
  onClose,
}: ChatPanelProps) {
  const { messages, sendMessage } = useRouteChat(socket, routeId, user);
  const [inputText, setInputText] = useState("");
  const maxChars = 77;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.slice(0, maxChars));
    setInputText("");
  };

  return (
    <div className="fixed bottom-2 sm:bottom-20 right-2 sm:right-4 z-50 w-[95%] max-w-xs sm:w-80 flex flex-col rounded-xl sm:rounded-2xl border border-gray-300 shadow-lg bg-white/90 backdrop-blur-sm text-gray-900 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-2 sm:p-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
        <h3 className="font-semibold text-sm sm:text-base">{chatName} 💬</h3>
        <button
          onClick={onClose}
          className="text-white text-xl sm:text-2xl hover:text-red-300 transition"
        >
          &times;
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 flex flex-col p-2 sm:p-3 overflow-y-auto max-h-72 sm:max-h-96 space-y-1 sm:space-y-2 scrollbar-thin"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#3b82f6 #e5e7eb",
        }}
      >
        {messages.map((msg: Message) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[80%] break-words ${
              msg.self ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`p-1 sm:p-2 rounded-lg sm:rounded-xl shadow-sm ${
                msg.self
                  ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white"
                  : "bg-white/50 text-gray-900 backdrop-blur-sm"
              }`}
            >
              <div className="font-semibold text-[0.7rem] sm:text-sm">
                {msg.self ? "You" : msg.user}
              </div>
              <div className="mt-0.5 text-[0.75rem] sm:text-sm">{msg.text}</div>
            </div>
            <div
              className={`text-[0.55rem] sm:text-[0.65rem] mt-0.5 ${
                msg.self
                  ? "text-right pr-1 text-black/70"
                  : "text-left pl-1 text-black/60"
              }`}
            >
              {formatTimestamp(msg.ts!)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="p-1 sm:p-3 border-t border-gray-200 bg-white/20 backdrop-blur-sm flex items-center gap-1 sm:gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value.slice(0, maxChars))}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-grow bg-white/30 border border-gray-300 rounded-full px-2 py-1 sm:px-3 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 transition backdrop-blur-sm"
        />
        <button
          onClick={handleSend}
          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition shadow-md flex items-center justify-center"
        >
          <FaPaperPlane className="text-sm sm:text-base" />
        </button>
      </div>
    </div>
  );
}
