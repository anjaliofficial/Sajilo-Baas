"use client";

import React, { useEffect, useRef } from "react";

interface ContextMenuProps {
    isOpen: boolean;
    x: number;
    y: number;
    isOwnMessage: boolean;
    onClose: () => void;
    onCopy: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    isOpen,
    x,
    y,
    isOwnMessage,
    onClose,
    onCopy,
    onEdit,
    onDelete,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscapeKey);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Adjust position to stay within viewport
    let adjustedX = x;
    let adjustedY = y;
    const menuWidth = 200;
    const menuHeight = isOwnMessage ? 150 : 100;
    const padding = 10;

    // Adjust X: if menu goes off right side, move it left
    if (adjustedX + menuWidth + padding > window.innerWidth) {
        adjustedX = window.innerWidth - menuWidth - padding;
    }
    // Don't let it go too far left either
    if (adjustedX < padding) {
        adjustedX = padding;
    }

    // Adjust Y: if menu goes off bottom, move it up
    if (adjustedY + menuHeight + padding > window.innerHeight) {
        adjustedY = adjustedY - menuHeight - 10; // Show above the click point instead
    }
    // Don't let it go too high
    if (adjustedY < padding) {
        adjustedY = padding;
    }

    const menuItems = [
        { label: "Copy", onClick: onCopy },
    ];

    if (isOwnMessage) {
        menuItems.push(
            { label: "Edit", onClick: onEdit },
            { label: "Delete", onClick: onDelete }
        );
    } else {
        menuItems.push(
            { label: "Delete", onClick: onDelete }
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Context Menu */}
            <div
                ref={menuRef}
                className="fixed z-50 bg-gray-800 text-white rounded-lg shadow-2xl border border-gray-700 py-2 w-48 animate-in fade-in zoom-in-95"
                style={{
                    left: `${adjustedX}px`,
                    top: `${adjustedY}px`,
                }}
            >
                {menuItems.map((item, index) => (
                    <div key={index}>
                        <button
                            onClick={() => {
                                console.log("Menu item clicked:", item.label);
                                item.onClick();
                                onClose();
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors text-sm"
                        >
                            <span>{item.label}</span>
                        </button>
                        {index < menuItems.length - 1 && (
                            <div className="h-px bg-gray-700"></div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
};

export default ContextMenu;
