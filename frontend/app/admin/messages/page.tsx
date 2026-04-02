"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
    Search,
    MessageCircle,
    Send,
    Loader2,
    User,
    Calendar,
    Home,
    MessageSquare,
    Lock,
} from "lucide-react";
import { getToken } from "@/lib/auth/storage";

interface Message {
    _id: string;
    sender: {
        _id: string;
        fullName: string;
        profilePicture?: string;
        email: string;
    };
    receiver: {
        _id: string;
        fullName: string;
        profilePicture?: string;
        email: string;
    };
    content?: string; // 🔒 PRIVACY: Excluded by backend
    media?: string[]; // 🔒 PRIVACY: Excluded by backend
    listing?: {
        _id: string;
        title: string;
    };
    createdAt: string;
    status: string;
    read: boolean;
}

interface Conversation {
    otherUserId: string;
    otherUserName: string;
    otherUserEmail: string;
    otherUserImage?: string;
    lastMessage: Message;
    messageCount: number;
}

export default function AdminMessagesPage() {
    const [activeTab, setActiveTab] = useState<"all" | "conversations">("all");
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [userId, setUserId] = useState("");
    const [selectedConversation, setSelectedConversation] = useState<{
        userId: string;
        userName: string;
    } | null>(null);
    const [conversationMessages, setConversationMessages] = useState<Message[]>(
        []
    );
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Fetch all messages
    const fetchMessages = useCallback(
        async (searchTerm = "", userIdFilter = "") => {
            try {
                setLoading(true);
                const params = new URLSearchParams();

                if (searchTerm) {
                    params.append("search", searchTerm);
                }
                if (userIdFilter) {
                    params.append("userId", userIdFilter);
                }

                params.append("limit", "20");

                const token = getToken();
                const response = await fetch(
                    `/api/admin/messages?${params.toString()}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    }
                );

                if (!response.ok) throw new Error("Failed to fetch messages");

                const data = await response.json();
                setMessages(data.messages || []);
                setCursor(data.nextCursor || null);
                setHasMore(!!data.nextCursor);
            } catch (error) {
                console.error("Error fetching messages:", error);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Fetch all conversations
    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getToken();
            const response = await fetch("/api/admin/messages/conversations", {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!response.ok) {
                setError("Conversations feature is not available yet");
                setConversations([]);
                return;
            }

            const data = await response.json();
            setConversations(data.conversations || []);
            setError(null);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
            setError("Failed to load conversations");
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch conversation between two users
    const fetchConversationBetweenUsers = useCallback(
        async (userId1: string, userId2: string) => {
            try {
                setLoading(true);
                const token = getToken();
                const response = await fetch(
                    `/api/admin/messages/between/${userId1}/${userId2}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    }
                );

                if (!response.ok)
                    throw new Error("Failed to fetch conversation messages");

                const data = await response.json();
                setConversationMessages(data.messages || []);
            } catch (error) {
                console.error("Error fetching conversation:", error);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Initial load
    useEffect(() => {
        if (activeTab === "all") {
            fetchMessages();
        } else {
            fetchConversations();
        }
    }, [activeTab, fetchMessages, fetchConversations]);

    // Search handler
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeTab === "all") {
            fetchMessages(searchQuery, userId);
        }
    };

    // Conversation click handler
    const handleConversationClick = (conversation: Conversation) => {
        setSelectedConversation({
            userId: conversation.otherUserId,
            userName: conversation.otherUserName,
        });
        fetchConversationBetweenUsers(
            conversation.otherUserId,
            conversation.lastMessage.sender._id
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Message Management
                    </h1>
                    <p className="text-gray-600">
                        View and search all messages exchanged between users
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => {
                            setActiveTab("all");
                            setSelectedConversation(null);
                        }}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === "all"
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <MessageCircle size={18} />
                            All Messages
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("conversations");
                            setSelectedConversation(null);
                        }}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === "conversations"
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <User size={18} />
                            Conversations
                        </div>
                    </button>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Messages or Conversations List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/*  Search Bar Disabled for Privacy - Metadata Only View */}
                            {activeTab === "all" && (
                                <div className="border-b p-4 bg-red-50">
                                    <div className="mb-4 flex items-start gap-2 text-red-700 text-sm">
                                        <Lock size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>Content search disabled - Viewing metadata only (sender, receiver, timestamp, listing)</span>
                                    </div>
                                    <form onSubmit={handleSearch} className="space-y-4">
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <Search className="absolute left-3 top-3 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search (disabled - content protected)"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    disabled
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled
                                                className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                                            >
                                                Search
                                            </button>
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Filter by User ID..."
                                                value={userId}
                                                onChange={(e) => setUserId(e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserId("");
                                                    fetchMessages(searchQuery, "");
                                                }}
                                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Messages/Conversations List */}
                            <div className="max-h-96 overflow-y-auto">
                                {loading && messages.length === 0 && conversations.length === 0 ? (
                                    <div className="flex items-center justify-center h-64">
                                        <Loader2 className="animate-spin text-blue-600" />
                                    </div>
                                ) : activeTab === "all" ? (
                                    // All Messages View - Metadata Only (Privacy Protected)
                                    <div className="divide-y">
                                        {messages.length > 0 ? (
                                            messages.map((message) => (
                                                <div
                                                    key={message._id}
                                                    className="p-4 hover:bg-gray-50 cursor-pointer border-l-4 border-transparent hover:border-blue-600 transition-all"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex gap-3 flex-1">
                                                            {message.sender.profilePicture ? (
                                                                <img
                                                                    src={message.sender.profilePicture}
                                                                    alt={message.sender.fullName}
                                                                    className="w-10 h-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                                                                    <User size={20} className="text-blue-600" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-semibold text-gray-900">
                                                                        {message.sender.fullName}
                                                                    </p>
                                                                    <span className="text-gray-500 text-sm">
                                                                        to
                                                                    </span>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {message.receiver.fullName}
                                                                    </p>
                                                                </div>
                                                                {/* 🔒 PRIVACY: Show only icon, not content */}
                                                                <div className="flex items-center gap-2 mt-2 text-gray-600">
                                                                    <Lock size={14} className="text-red-500" />
                                                                    <MessageSquare size={14} className="text-gray-400" />
                                                                    <span className="text-xs text-gray-500 italic">
                                                                        Message content protected
                                                                    </span>
                                                                </div>
                                                                {message.listing && (
                                                                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                                                        <Home size={14} />
                                                                        {message.listing.title}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(message.createdAt).toLocaleDateString()}
                                                            </p>
                                                            {!message.read && (
                                                                <span className="inline-block mt-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                No messages found
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Conversations View
                                    <div className="divide-y">
                                        {error ? (
                                            <div className="p-8 text-center text-gray-600">
                                                <MessageCircle className="mx-auto mb-3 text-gray-400" size={32} />
                                                <p>{error}</p>
                                            </div>
                                        ) : conversations.length > 0 ? (
                                            conversations.map((conv) => (
                                                <div
                                                    key={conv.otherUserId}
                                                    onClick={() => handleConversationClick(conv)}
                                                    className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 transition-all ${selectedConversation?.userId === conv.otherUserId
                                                        ? "border-blue-600 bg-blue-50"
                                                        : "border-transparent"
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {conv.otherUserImage ? (
                                                            <img
                                                                src={conv.otherUserImage}
                                                                alt={conv.otherUserName}
                                                                className="w-12 h-12 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <User size={24} className="text-gray-600" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900">
                                                                {conv.otherUserName ?? "Unknown User"}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {conv.otherUserEmail ?? "N/A"}
                                                            </p>
                                                            <p className="text-sm text-gray-700 truncate mt-1">
                                                                {conv.lastMessage?.content ?? "No messages"}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {`${conv.messageCount} message${conv.messageCount !== 1 ? "s" : ""}`}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">
                                                                {conv.lastMessage?.createdAt
                                                                    ? new Date(
                                                                        conv.lastMessage.createdAt
                                                                    ).toLocaleDateString()
                                                                    : "N/A"
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                No conversations found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Load More Button */}
                            {hasMore && activeTab === "all" && (
                                <div className="border-t p-4 text-center">
                                    <button
                                        onClick={() => fetchMessages(searchQuery, userId)}
                                        disabled={loading}
                                        className="text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        {loading ? "Loading..." : "Load More"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Conversation Detail */}
                    {selectedConversation && (
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-96">
                                {/* Conversation Header */}
                                <div className="border-b p-4 bg-gradient-to-r from-blue-50 to-blue-100">
                                    <p className="font-semibold text-gray-900">
                                        {selectedConversation.userName}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {conversationMessages.length} messages
                                    </p>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="animate-spin text-blue-600" />
                                        </div>
                                    ) : conversationMessages.length > 0 ? (
                                        conversationMessages.map((message) => (
                                            <div key={message._id} className="space-y-1">
                                                <div className="text-xs text-gray-500">
                                                    <span className="font-semibold">
                                                        {message.sender.fullName}
                                                    </span>
                                                    {" • "}
                                                    {new Date(message.createdAt).toLocaleString()}
                                                </div>
                                                <div className="bg-gray-100 rounded-lg p-3">
                                                    <p className="text-sm text-gray-900">
                                                        {message.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            No messages in this conversation
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
