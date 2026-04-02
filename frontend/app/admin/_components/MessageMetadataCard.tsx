"use client";

import { MessageCircle, Image, Video, FileText, Clock, User } from "lucide-react";

interface MessageMetadata {
    messageId: string;
    sender: string;
    receiver: string;
    type: "text" | "image" | "video" | "audio" | "file";
    timestamp: string;
    deliveryStatus: "sent" | "delivered" | "read";
    mediaCount?: number;
}

interface MessageMetadataCardProps {
    message: MessageMetadata;
    onViewReport?: (messageId: string) => void;
}

/**
 * 🔐 Safe Message Display Component
 * Shows ONLY metadata - NO content, NO URLs
 * Visually proves privacy protection
 */
export default function MessageMetadataCard({
    message,
    onViewReport,
}: MessageMetadataCardProps) {
    // Map message type to icon
    const getTypeIcon = (type: string) => {
        switch (type) {
            case "image":
                return <Image size={18} className="text-blue-600" />;
            case "video":
                return <Video size={18} className="text-purple-600" />;
            case "file":
                return <FileText size={18} className="text-orange-600" />;
            case "audio":
                return <FileText size={18} className="text-green-600" />;
            default:
                return <MessageCircle size={18} className="text-gray-600" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "text":
                return "Text Message";
            case "image":
                return "Image Message";
            case "video":
                return "Video Message";
            case "audio":
                return "Audio Message";
            case "file":
                return "File Message";
            default:
                return "Message";
        }
    };

    const getDeliveryColor = (status: string) => {
        switch (status) {
            case "read":
                return "bg-green-100 text-green-800";
            case "delivered":
                return "bg-blue-100 text-blue-800";
            case "sent":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* Header: Type and Status */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {getTypeIcon(message.type)}
                    <span className="font-semibold text-gray-800">
                        {getTypeLabel(message.type)}
                    </span>
                    {message.mediaCount && message.mediaCount > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {message.mediaCount} file{message.mediaCount > 1 ? "s" : ""}
                        </span>
                    )}
                </div>
                <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${getDeliveryColor(
                        message.deliveryStatus
                    )}`}
                >
                    {message.deliveryStatus}
                </span>
            </div>

            {/* Content: Metadata Only (Privacy Protected) */}
            <div className="space-y-2 mb-3">
                {/* Sender */}
                <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-700">
                        <strong>From:</strong> {message.sender}
                    </span>
                </div>

                {/* Receiver */}
                <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-700">
                        <strong>To:</strong> {message.receiver}
                    </span>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-gray-700">
                        {new Date(message.timestamp).toLocaleString()}
                    </span>
                </div>

                {/* 🔐 Privacy Notice */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 italic">
                        🔒 Message content is protected and hidden from admin view unless reported by users.
                    </p>
                </div>
            </div>

            {/* Actions */}
            {onViewReport && (
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                        onClick={() => onViewReport(message.messageId)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                        View Reports →
                    </button>
                </div>
            )}
        </div>
    );
}
