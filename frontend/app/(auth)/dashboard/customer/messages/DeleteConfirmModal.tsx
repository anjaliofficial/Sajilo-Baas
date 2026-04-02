"use client";

import React, { useState } from "react";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleteForMe: () => Promise<void>;
    onDeleteForEveryone: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    onDeleteForMe,
    onDeleteForEveryone,
}) => {
    const [deletingType, setDeletingType] = useState<"for_me" | "for_everyone" | null>(null);

    if (!isOpen) return null;

    const handleDeleteForMe = async () => {
        setDeletingType("for_me");
        try {
            await onDeleteForMe();
            console.log("Delete for me completed successfully");
            // Auto-close after success
            setTimeout(() => {
                onClose();
                setDeletingType(null);
            }, 600);
        } catch (err: any) {
            console.error("Delete for me error:", err);
            setDeletingType(null);
        }
    };

    const handleDeleteForEveryone = async () => {
        setDeletingType("for_everyone");
        try {
            await onDeleteForEveryone();
            console.log("Delete for everyone completed successfully");
            // Auto-close after success
            setTimeout(() => {
                onClose();
                setDeletingType(null);
            }, 600);
        } catch (err: any) {
            console.error("Delete for everyone error:", err);
            setDeletingType(null);
        }
    };

    const isDeleting = deletingType !== null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 text-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-700 animate-in fade-in zoom-in-95">
                    {/* Header */}
                    <div className="px-6 py-6 border-b border-gray-700">
                        <h2 className="text-xl font-semibold">Delete message?</h2>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4">
                        <p className="text-gray-300 text-sm mb-4">
                            Choose how you want to delete this message.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="px-6 py-4 border-t border-gray-700 space-y-3">
                        {/* Delete for Everyone */}
                        <button
                            onClick={handleDeleteForEveryone}
                            disabled={isDeleting}
                            className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {deletingType === "for_everyone" && (
                                <span className="animate-spin text-lg">⏳</span>
                            )}
                            <span>Delete for everyone</span>
                        </button>

                        {/* Delete for Me */}
                        <button
                            onClick={handleDeleteForMe}
                            disabled={isDeleting}
                            className="w-full px-4 py-3 bg-teal-700 hover:bg-teal-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {deletingType === "for_me" && (
                                <span className="animate-spin text-lg">⏳</span>
                            )}
                            <span>Delete for me</span>
                        </button>

                        {/* Cancel */}
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DeleteConfirmModal;
