"use client";

import React, { useEffect } from "react";

interface ToastProps {
    message: string;
    type?: "success" | "error" | "info";
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = "info",
    onClose,
    duration = 3000,
}) => {
    useEffect(() => {
        if (!message) return;
        const timeout = setTimeout(onClose, duration);
        return () => clearTimeout(timeout);
    }, [message, onClose, duration]);

    if (!message) return null;

    const bgColor =
        type === "success"
            ? "bg-green-500"
            : type === "error"
                ? "bg-red-500"
                : "bg-blue-500";

    return (
        <div
            className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg z-[9999] animate-pulse`}
        >
            {message}
        </div>
    );
};

export default Toast;
