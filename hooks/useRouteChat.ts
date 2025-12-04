"use client";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export interface Message {
  id: number;
  user: string;
  text: string;
  self?: boolean;
  selfId?: string;
  ts?: number;
}

export function useRouteChat(
  socket: Socket | null,
  routeId: string,
  currentUser: string
) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!socket || !routeId) return;

    // Join route chat
    socket.emit("chat:join", routeId);

    const handleInit = ({ messages }: { messages: Message[] }) => {
      setMessages(
        messages.map((m) => ({ ...m, self: m.selfId === socket.id }))
      );
    };

    const handleUpdate = ({ message }: { message: Message }) => {
      setMessages((prev) =>
        [...prev, { ...message, self: message.selfId === socket.id }].slice(-50)
      );
    };

    socket.on("chat:init", handleInit);
    socket.on("chat:update", handleUpdate);

    return () => {
      socket.off("chat:init", handleInit);
      socket.off("chat:update", handleUpdate);
    };
  }, [socket, routeId]);

  const sendMessage = (text: string) => {
    if (!socket || !text.trim()) return;
    socket.emit("chat:send", { routeId, user: currentUser, text });
  };

  return { messages, sendMessage };
}
