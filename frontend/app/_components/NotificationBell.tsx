import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useNotificationSocket } from '../../lib/notification-socket';

interface Notification {
    id: string;
    message: string;
    read: boolean;
    createdAt: string;
    link?: string;
}

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/notifications', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setNotifications(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setNotifications([]);
                setLoading(false);
            });
    }, []);

    const handleNotification = useCallback((data: Notification) => {
        setNotifications(prev => [data, ...prev]);
    }, []);

    useNotificationSocket(handleNotification);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (id: string) => {
        await fetch(`/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ read: true })
        });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                className="relative p-2 rounded-xl hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-200"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-label="Notifications"
            >
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-blue-600 rounded-full ring-2 ring-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
            {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-semibold text-gray-900">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {loading ? (
                        <div className="p-4 text-sm text-gray-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">No notifications</div>
                    ) : (
                        <ul>
                            {notifications.slice(0, 10).map((notification) => (
                                <li
                                    key={notification.id}
                                    className={`px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-blue-50 cursor-pointer ${notification.read ? 'text-gray-500' : 'text-gray-900'}`}
                                    onClick={async () => {
                                        if (!notification.read) {
                                            await markAsRead(notification.id);
                                        }
                                        if (notification.link) router.push(notification.link);
                                        setDropdownOpen(false);
                                    }}
                                >
                                    <div className="flex items-start gap-2">
                                        {!notification.read && <span className="mt-1 w-2 h-2 rounded-full bg-blue-500"></span>}
                                        <div className="flex-1">
                                            <div className={`text-sm ${notification.read ? 'font-normal' : 'font-semibold'}`}>{notification.message}</div>
                                            <div className="text-xs text-gray-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="border-t border-gray-100 p-2 text-center">
                        <button
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            onClick={() => {
                                router.push('/public/notifications');
                                setDropdownOpen(false);
                            }}
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
