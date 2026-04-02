
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { FaEnvelope, FaCalendarCheck, FaStar, FaReply, FaBell, FaTrash, FaCheckCircle } from 'react-icons/fa';
import { useNotificationSocket } from '../../../lib/notification-socket';
import Sidebar from '../../(auth)/dashboard/_components/Sidebar';
import Header from '../../(auth)/dashboard/_components/Header';
import { useRouter } from 'next/navigation';
import { getToken } from '../../../lib/auth/storage';

interface Notification {
    _id: string;
    message: string;
    read: boolean;
    createdAt: string;
    link?: string;
}


const getIcon = (msg: string) => {
    if (msg.toLowerCase().includes('message')) return <FaEnvelope className="w-5 h-5 text-blue-500" />;
    if (msg.toLowerCase().includes('booking')) return <FaCalendarCheck className="w-5 h-5 text-green-500" />;
    if (msg.toLowerCase().includes('review')) return <FaStar className="w-5 h-5 text-yellow-500" />;
    if (msg.toLowerCase().includes('reply')) return <FaReply className="w-5 h-5 text-purple-500" />;
    return <FaBell className="w-5 h-5 text-gray-400" />;
};

const getIconBg = (msg: string) => {
    if (msg.toLowerCase().includes('message')) return 'bg-blue-100';
    if (msg.toLowerCase().includes('booking')) return 'bg-green-100';
    if (msg.toLowerCase().includes('review')) return 'bg-yellow-100';
    if (msg.toLowerCase().includes('reply')) return 'bg-purple-100';
    return 'bg-gray-100';
};

const NotificationsPage: React.FC = () => {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [animId, setAnimId] = useState<string | null>(null);

    useEffect(() => {
        const token = getToken();
        fetch('/api/notifications', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
            .then(res => res.json())
            .then(data => {
                setNotifications(data);
                setLoading(false);
            });
    }, []);

    // Real-time notification handler
    const handleNotification = useCallback((data: Notification) => {
        setNotifications(prev => [data, ...prev]);
        setAnimId(data._id);
        setTimeout(() => setAnimId(null), 1200);
    }, []);

    useNotificationSocket(handleNotification);

    // Mark as read/unread
    const toggleRead = async (id: string, read: boolean) => {
        const token = getToken();
        await fetch(`/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ read: !read })
        });
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: !read } : n));
    };

    // Delete notification
    const deleteNotification = async (id: string) => {
        const token = getToken();
        await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        setNotifications(prev => prev.filter(n => n._id !== id));
    };

    // Mark all as read
    const markAllAsRead = async () => {
        const token = getToken();
        await Promise.all(
            notifications.filter(n => !n.read).map(n =>
                fetch(`/api/notifications/${n._id}/read`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ read: true })
                })
            )
        );
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    <div className="max-w-4xl mx-auto">
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-4 mb-5 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                                            <FaBell className="w-6 h-6" />
                                            Notifications
                                        </h1>
                                        <p className="text-blue-100 text-sm">
                                            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => router.back()}
                                        className="px-3.5 py-1.5 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back
                                    </button>
                                </div>
                            </div>
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full -ml-24 -mb-24 blur-3xl"></div>
                        </div>

                        {/* Filter and Actions */}
                        <div className="bg-white rounded-2xl shadow-lg p-4 mb-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex gap-3">
                                    <button
                                        className={`px-4 py-2 rounded-xl font-semibold transition-all transform hover:scale-105 ${filter === 'all'
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        onClick={() => setFilter('all')}
                                    >
                                        All ({notifications.length})
                                    </button>
                                    <button
                                        className={`px-4 py-2 rounded-xl font-semibold transition-all transform hover:scale-105 ${filter === 'unread'
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        onClick={() => setFilter('unread')}
                                    >
                                        Unread ({unreadCount})
                                    </button>
                                </div>
                                <button
                                    className="px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    onClick={markAllAsRead}
                                    disabled={notifications.every(n => n.read)}
                                >
                                    <FaCheckCircle className="w-4 h-4" />
                                    Mark All as Read
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-gray-600 text-lg">Loading notifications...</p>
                                </div>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <FaBell className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications</h3>
                                <p className="text-gray-600">
                                    {filter === 'unread'
                                        ? "You're all caught up! No unread notifications."
                                        : "You don't have any notifications yet."}
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {filteredNotifications.map((notification) => (
                                    <li
                                        key={notification._id}
                                        className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${!notification.read ? 'border-l-4 border-blue-500' : ''
                                            } ${animId === notification._id ? 'ring-4 ring-blue-400 scale-[1.02]' : ''}`}
                                        style={{ cursor: notification.link ? 'pointer' : 'default' }}
                                        onClick={() => {
                                            if (notification.link) router.push(notification.link);
                                        }}
                                    >
                                        <div className="p-4 flex items-start gap-3">
                                            {/* Icon */}
                                            <div className={`w-10 h-10 ${getIconBg(notification.message)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                                {getIcon(notification.message)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm mb-1.5 ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:shadow-md ${notification.read
                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        }`}
                                                    onClick={() => toggleRead(notification._id, notification.read)}
                                                    title={notification.read ? 'Mark as unread' : 'Mark as read'}
                                                >
                                                    <FaEnvelope className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all hover:shadow-md"
                                                    onClick={() => deleteNotification(notification._id)}
                                                    title="Delete notification"
                                                >
                                                    <FaTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default NotificationsPage;

