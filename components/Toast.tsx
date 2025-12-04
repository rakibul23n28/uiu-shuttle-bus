// src/components/Toast.tsx
import React, { useEffect } from "react";
import { HiCheckCircle, HiXCircle, HiInformationCircle } from "react-icons/hi";

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  // Determine the toast style based on keywords in the message
  const getStyle = (msg: string) => {
    if (
      msg.toLowerCase().includes("successfully") ||
      msg.toLowerCase().includes("started") ||
      msg.toLowerCase().includes("🟢")
    ) {
      return { className: "bg-green-600", Icon: HiCheckCircle };
    }
    if (
      msg.toLowerCase().includes("stopped") ||
      msg.toLowerCase().includes("🛑")
    ) {
      return { className: "bg-red-600", Icon: HiXCircle };
    }
    if (
      msg.toLowerCase().includes("error") ||
      msg.toLowerCase().includes("warning") ||
      msg.toLowerCase().includes("⚠️")
    ) {
      return { className: "bg-yellow-600", Icon: HiInformationCircle };
    }
    return { className: "bg-gray-800", Icon: HiInformationCircle };
  };

  // 👈 FIX: Assign the result of getStyle to the 'style' variable
  const style = message ? getStyle(message) : null;

  // Auto-dismiss logic: Stays visible for 3000ms (3 seconds)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    console.log(message);

    if (message) {
      console.log("ndjkshdjkshdj");

      // Set the timer for 3000ms
      timer = setTimeout(() => {
        onClose();
      }, 3000);

      // Log for debugging: This should fire 3 seconds after the message appears
      // console.log("Toast timer set for 3 seconds:", message);
    }

    // Cleanup function: Clear the timeout if the message changes or component unmounts
    return () => {
      if (timer) {
        clearTimeout(timer);
        // console.log("Toast timer cleared.");
      }
    };
  }, [message, onClose]); // Dependencies

  // This check now works because 'style' is defined above.
  if (!message || !style) return null;

  const Icon = style.Icon;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[60] transition-all duration-300 ease-in-out">
      <div
        className={`flex items-center gap-3 p-3 rounded-xl shadow-2xl text-white font-semibold ${style.className} backdrop-blur-sm border border-white/20`}
        role="alert"
      >
        <Icon className="h-6 w-6" />
        <span className="text-sm sm:text-base">
          {message.replace(/[\uD800-\uDBFF\uDC00-\uDFFF]/g, "").trim()}
        </span>
      </div>
    </div>
  );
}
