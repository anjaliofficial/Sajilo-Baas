"use client";

import React, { useEffect, useRef, useState } from "react";
import { Message, MessageStatus } from "./types";

interface MessageBubbleProps {
    message: Message;
    isOwnMessage: boolean;
    onEdit: (messageId: string) => void;
    onDelete: (messageId: string, type: "for_me" | "for_everyone") => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isOwnMessage,
    onEdit,
    onDelete,
}) => {
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);

    // Check if deleted for current user
    const isDeletedForMe = message.deletedFor.includes("current-user-id");
    const isDeletedForEveryone = message.isDeleted;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                optionsRef.current &&
                !optionsRef.current.contains(event.target as Node)
            ) {
                setShowOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Render deleted message
    if (isDeletedForEveryone) {
        return (
            <div
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-2`}
            >
                <div className="text-gray-400 text-sm italic">
                    {isOwnMessage ? "You deleted this message" : "This message was deleted"}
                </div>
            </div>
        );
    }

    // Render deleted for me
    if (isDeletedForMe) {
        return null;
    }

    const messageTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const statusIcon = isOwnMessage ? (
        <span className="text-xs ml-1">
            {message.status === MessageStatus.SENT && "✓"}
            {message.status === MessageStatus.DELIVERED && "✓✓"}
            {message.status === MessageStatus.READ && (
                <span className="text-blue-500">✓✓</span>
            )}
        </span>
    ) : null;

    return (
        <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3 relative group ${isDeletedForEveryone ? "pointer-events-none opacity-60" : ""}`}>
            <div
                className={`max-w-xs px-4 py-2 rounded-lg ${isOwnMessage
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                    } ${isDeletedForEveryone ? "opacity-75" : ""}`}
            >
                <div className="flex flex-col">
                    <p className={`text-sm ${isOwnMessage ? "text-white" : "text-gray-900"}`}>
                        {message.content}
                    </p>

                    <div
                        className={`flex items-center justify-between mt-1 text-xs ${isOwnMessage ? "text-blue-100" : "text-gray-500"
                            }`}
                    >
                        <span>{messageTime}</span>
                        {message.isEdited && <span className="italic">edited</span>}
                        {statusIcon}
                    </div>
                </div>
            </div>

            {/* Message options menu */}
            {isOwnMessage && !isDeletedForEveryone && (
                <div ref={optionsRef} className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded-full hover:bg-gray-200"
                    >
                        ⋮
                    </button>

                    {showOptions && (
                        <div className="absolute right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                            <button
                                onClick={() => {
                                    onEdit(message._id);
                                    setShowOptions(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 rounded-t"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(message._id, "for_me");
                                    setShowOptions(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-100 border-t border-gray-300"
                            >
                                Delete for me
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(message._id, "for_everyone");
                                    setShowOptions(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 border-t border-gray-300 rounded-b"
                            >
                                Delete for all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
