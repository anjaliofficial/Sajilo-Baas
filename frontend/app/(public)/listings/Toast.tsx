import React from "react";

interface ToastProps {
    message: string;
    type?: "success" | "error" | "info";
    onClose?: () => void;
}

const toastColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
};

const Toast: React.FC<ToastProps> = ({ message, type = "info", onClose }) => {
    React.useEffect(() => {
        if (onClose) {
            const timer = setTimeout(onClose, 3500);
            return () => clearTimeout(timer);
        }
    }, [onClose]);

    return (
        <div
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg text-white z-50 ${toastColors[type]}`}
            role="alert"
        >
            <span>{message}</span>
            {onClose && (
                <button
                    className="ml-4 text-white font-bold"
                    onClick={onClose}
                    aria-label="Close notification"
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default Toast;
