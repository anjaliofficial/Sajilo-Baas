"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getDashboardPath } from "@/lib/auth/roles";
import ContextMenu from "./ContextMenu";
import DeleteConfirmModal from "./DeleteConfirmModal";
import Toast from "./Toast";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE.slice(0, -4)
  : RAW_API_BASE;

const normalizeMediaUrl = (url: string): string => {
  if (!url) return "";
  const normalized = url.replace(/\\/g, "/");
  if (normalized.startsWith("http")) return normalized;
  if (normalized.startsWith("/uploads/")) {
    return `${API_BASE}${normalized}`;
  }
  const filename = normalized.split("/").pop() || normalized;
  return `${API_BASE}/uploads/${filename}`;
};

const getUserId = (u: any): string | undefined => {
  if (!u) return undefined;
  if (typeof u === "string") return u;
  if (u.id) return u.id;
  if ((u as any)._id) return (u as any)._id;
  return undefined;
};

interface Message {
  _id: string;
  sender: string | { _id?: string; id?: string; fullName?: string; profilePicture?: string };
  receiver: string | { _id?: string; id?: string; fullName?: string; profilePicture?: string };
  content: string;
  type?: "text" | "media";
  media?: MediaItem[];
  createdAt: string;
  read?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  deletedBy?: string;
}

interface ThreadItem {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserImage?: string;
  listingId: string;
  bookingId: string;
  title: string;
  subtitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
}

interface MediaItem {
  url: string;
  mimeType: string;
  kind: "image" | "video";
  fileName?: string;
}

interface AttachmentPreview {
  file: File;
  url: string;
  kind: "image" | "video";
}

export default function HostMessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState({
    otherUserId: "",
    listingId: "",
    bookingId: "",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesCursor, setMessagesCursor] = useState<string | null>(null);
  const [messagesHasMore, setMessagesHasMore] = useState(false);
  const [messagesLoadingMore, setMessagesLoadingMore] = useState(false);
  const messagePageSize = 20;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsCursor, setThreadsCursor] = useState<string | null>(null);
  const [threadsHasMore, setThreadsHasMore] = useState(false);
  const [threadsLoadingMore, setThreadsLoadingMore] = useState(false);
  const threadPageSize = 6;
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editOriginal, setEditOriginal] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    messageId: "",
    isOwnMessage: false,
  });

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    messageId: "",
  });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "host") {
      router.replace(getDashboardPath(user.role));
      return;
    }

    setReady(true);
  }, [loading, user, router]);

  useEffect(() => {
    if (!ready) return;

    const normalizeId = (value: string | null) => {
      if (!value) return "";
      if (value === "undefined" || value === "null") return "";
      return value;
    };

    const otherUserId = normalizeId(
      searchParams.get("customerId") || searchParams.get("otherUserId"),
    );
    const listingId = normalizeId(searchParams.get("listingId")) || "all";
    const bookingId = normalizeId(searchParams.get("bookingId"));

    setSelected({ otherUserId, listingId, bookingId });
  }, [ready, searchParams]);

  const setSelectedThread = (thread: {
    otherUserId: string;
    listingId: string;
    bookingId: string;
  }) => {
    setSelected(thread);
    const params = new URLSearchParams();
    if (thread.otherUserId) params.set("customerId", thread.otherUserId);
    if (thread.listingId) params.set("listingId", thread.listingId);
    if (thread.bookingId) params.set("bookingId", thread.bookingId);
    const query = params.toString();
    router.replace(query ? `/dashboard/host/messages?${query}` : "/dashboard/host/messages");
  };

  const markThreadRead = async (thread: {
    otherUserId: string;
    listingId: string;
  }) => {
    try {
      await fetch("/api/messages/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          otherUserId: thread.otherUserId,
          listingId: thread.listingId,
        }),
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const formatPreview = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return "No messages yet";
    return trimmed.length > 60 ? `${trimmed.slice(0, 60)}...` : trimmed;
  };

  const formatTimestamp = (value: string) => {
    if (!value) return "";
    return new Date(value).toLocaleString();
  };

  const fetchThreads = async (options?: {
    cursor?: string | null;
    append?: boolean;
  }) => {
    const append = Boolean(options?.append);
    if (append) {
      setThreadsLoadingMore(true);
    } else {
      setThreadsLoading(true);
    }
    try {
      const params = new URLSearchParams();
      params.set("limit", String(threadPageSize));
      if (options?.cursor) {
        params.set("cursor", options.cursor);
      }
      params.set("scope", "all");
      const res = await fetch(`/api/messages/threads?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load threads");
      }

      const items: ThreadItem[] = (data.threads || []).map((thread: any) => ({
        id: `${thread.otherUserId}_${thread.listingId}`,
        otherUserId: thread.otherUserId,
        otherUserName: thread.otherUserName || "Guest",
        otherUserImage: thread.otherUserImage,
        listingId: thread.listingId || "all",
        bookingId: "",
        title: thread.otherUserName || "Guest",
        subtitle: "",
        lastMessage:
          thread.lastMessage?.content ||
          (thread.lastMessage?.media?.length ? "Attachment" : ""),
        lastMessageAt: thread.lastMessage?.createdAt || "",
        unread: Boolean(thread.unreadCount && thread.unreadCount > 0),
      }));

      setThreads((prev) => (append ? [...prev, ...items] : items));
      setThreadsCursor(data.nextCursor || null);
      setThreadsHasMore(Boolean(data.nextCursor));
    } catch (error) {
      console.error("Error fetching threads:", error);
      if (!append) setThreads([]);
    } finally {
      if (append) {
        setThreadsLoadingMore(false);
      } else {
        setThreadsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!ready) return;
    fetchThreads();
  }, [ready]);

  useEffect(() => {
    const hasQuery =
      searchParams.get("customerId") ||
      searchParams.get("otherUserId") ||
      searchParams.get("listingId");
    if (hasQuery) return;
    if (selected.otherUserId) return; // Already selected, don't auto-select
    if (threads.length === 0) return;
    setSelectedThread({
      otherUserId: threads[0].otherUserId,
      listingId: threads[0].listingId,
      bookingId: threads[0].bookingId,
    });
  }, [threads, selected.otherUserId, searchParams]);

  const fetchMessages = async (
    otherUserId: string,
    listingId: string,
    options?: { cursor?: string | null; append?: boolean },
  ) => {
    const normalizedListingId =
      !listingId || listingId === "undefined" || listingId === "null"
        ? "all"
        : listingId;
    if (!otherUserId || !normalizedListingId) {
      if (!options?.append) {
        setMessages([]);
        setMessagesHasMore(false);
        setMessagesCursor(null);
      }
      return;
    }
    const append = Boolean(options?.append);
    if (append) {
      setMessagesLoadingMore(true);
    } else {
      setLoadingMessages(true);
    }

    try {
      const params = new URLSearchParams();
      params.set("limit", String(messagePageSize));
      if (options?.cursor) {
        params.set("cursor", options.cursor);
      }
      const res = await fetch(
        `/api/messages/${otherUserId}/${normalizedListingId}?${params.toString()}`,
        { credentials: "include" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load messages");
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      setMessages((prev) => (append ? [...list, ...prev] : list));
      setMessagesCursor(data.nextCursor || null);
      setMessagesHasMore(Boolean(data.nextCursor));

      if (!append) {
        await markThreadRead({
          otherUserId,
          listingId: normalizedListingId,
        });
        setThreads((prev) =>
          prev.map((thread) =>
            thread.otherUserId === otherUserId &&
              thread.listingId === normalizedListingId
              ? { ...thread, unread: false }
              : thread,
          ),
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (!append) setMessages([]);
    } finally {
      if (append) {
        setMessagesLoadingMore(false);
      } else {
        setLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    if (!selected.otherUserId || !selected.listingId) return;
    fetchMessages(selected.otherUserId, selected.listingId);
  }, [selected.otherUserId, selected.listingId]);

  const handleAttachFiles = (files: FileList | File[]) => {
    const next: AttachmentPreview[] = [];
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setToast({ message: "Only images and videos are allowed", type: "error" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setToast({ message: "File size exceeds 10MB", type: "error" });
        return;
      }
      next.push({
        file,
        url: URL.createObjectURL(file),
        kind: isImage ? "image" : "video",
      });
    });
    if (next.length) {
      setAttachments((prev) => [...prev, ...next]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return next;
    });
  };

  const uploadAttachments = async (): Promise<MediaItem[]> => {
    if (!attachments.length) return [];
    const formData = new FormData();
    attachments.forEach((item) => formData.append("image", item.file));

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || "Upload failed");
    }

    const uploaded = Array.isArray(data?.files) ? data.files : [];
    // Ensure each media item has kind and mimeType
    return uploaded.map((file: any) => ({
      url: file.path,
      mimeType: file.mimeType,
      kind: file.mimeType && String(file.mimeType).startsWith("video/") ? "video" : "image",
      fileName: file.filename,
    }));
  };

  const sendMessage = async (media?: MediaItem[]) => {
    if (!selected.otherUserId || !selected.listingId) return;
    const content = draft.trim();
    if (!content && (!media || media.length === 0)) return;
    try {
      // Ensure media array is properly structured
      const formattedMedia = media && media.length
        ? media.map((item) => ({
          url: item.url,
          mimeType: item.mimeType,
          kind: item.kind,
          fileName: item.fileName,
        }))
        : undefined;
      console.log("Sending message from host to customer:", selected.otherUserId);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiverId: selected.otherUserId,
          listingId: selected.listingId,
          content,
          media: formattedMedia,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to send message");
      }

      console.log("Message sent successfully:", data.data);
      setDraft("");
      setAttachments((prev) => {
        prev.forEach((item) => URL.revokeObjectURL(item.url));
        return [];
      });
      setToast({ message: "Message sent", type: "success" });
      fetchMessages(selected.otherUserId, selected.listingId);
      fetchThreads();
    } catch (error) {
      console.error("Error sending message:", error);
      setToast({ message: "Failed to send message", type: "error" });
    }
  };

  const submitMessage = async () => {
    if (editingMessageId) {
      const content = draft.trim();
      if (!content || content === editOriginal.trim()) {
        setEditingMessageId(null);
        setEditOriginal("");
        setDraft("");
        return;
      }
      await handleEditMessage(editingMessageId, content);
      return;
    }
    try {
      setUploading(true);
      const media = await uploadAttachments();
      await sendMessage(media);
    } catch (error) {
      console.error("Upload error:", error);
      setToast({ message: "Upload failed", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!content.trim()) {
      alert("Message content cannot be empty");
      return;
    }
    try {
      const res = await fetch(`/api/messages/message/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to edit message");
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content: content.trim(), isEdited: true }
            : msg
        )
      );
      setEditingMessageId(null);
      setEditOriginal("");
      setDraft("");
    } catch (error) {
      console.error("Error editing message:", error);
      alert(error instanceof Error ? error.message : "Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }
    try {
      const res = await fetch(`/api/messages/message/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ deleteType: "for_everyone" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete message");
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content: "This message has been deleted", isDeleted: true, deletedBy: user?.id || "" }
            : msg
        )
      );
    } catch (error) {
      console.error("Error deleting message:", error);
      alert(error instanceof Error ? error.message : "Failed to delete message");
    }
  };

  // Context Menu Event Handler
  const handleContextMenu = (
    e: React.MouseEvent,
    messageId: string,
    isOwn: boolean
  ) => {
    e.preventDefault();
    console.log("Right-click detected on message:", messageId);
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      messageId,
      isOwnMessage: isOwn,
    });
  };

  // Copy Message Handler
  const handleCopyMessage = () => {
    const message = messages.find((m) => m._id === contextMenu.messageId);
    if (message) {
      navigator.clipboard.writeText(message.content).then(() => {
        setToast({ message: "Message copied to clipboard", type: "success" });
        setContextMenu({ isOpen: false, x: 0, y: 0, messageId: "", isOwnMessage: false });
      });
    }
  };

  // Delete Handlers
  const handleDeleteForMe = async (): Promise<void> => {
    console.log("Delete for me clicked");
    try {
      console.log("Deleting message for me:", deleteConfirm.messageId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/messages/${deleteConfirm.messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ deleteType: "for_me" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete message");
      }

      console.log("Message deleted for me successfully");
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== deleteConfirm.messageId)
      );
      setContextMenu({ isOpen: false, x: 0, y: 0, messageId: "", isOwnMessage: false });
    } catch (err) {
      console.error("Error deleting message:", err);
      throw err;
    }
  };

  const handleDeleteForEveryone = async (): Promise<void> => {
    console.log("Delete for everyone clicked");
    try {
      console.log("Deleting message for everyone:", deleteConfirm.messageId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/messages/${deleteConfirm.messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ deleteType: "for_everyone" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete message");
      }

      console.log("Message deleted for everyone successfully");
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === deleteConfirm.messageId
            ? { ...msg, content: "This message has been deleted", isDeleted: true, deletedBy: user?.id || "" }
            : msg
        )
      );
      setContextMenu({ isOpen: false, x: 0, y: 0, messageId: "", isOwnMessage: false });
    } catch (err) {
      console.error("Error deleting message:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (messagesLoadingMore) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesLoadingMore]);

  if (!ready || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600 text-lg">Chat with guests about their bookings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversations</h2>
          {threadsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : threads.length === 0 ? (
            <p className="text-gray-500">No conversations yet.</p>
          ) : (
            <div className="space-y-1">
              {threads.map((thread) => {
                const isActive =
                  thread.otherUserId === selected.otherUserId &&
                  thread.listingId === selected.listingId;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() =>
                      setSelectedThread({
                        otherUserId: thread.otherUserId,
                        listingId: thread.listingId,
                        bookingId: thread.bookingId,
                      })
                    }
                    className={`w-full text-left px-3 py-2 rounded-lg border transition ${isActive
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                          {thread.otherUserImage ? (
                            <img
                              src={normalizeMediaUrl(thread.otherUserImage)}
                              alt={thread.otherUserName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            thread.otherUserName?.charAt(0)?.toUpperCase() || "U"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">{thread.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {thread.unread && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            New
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {formatTimestamp(thread.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 truncate">
                      {formatPreview(thread.lastMessage)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
          {threadsHasMore && !threadsLoading && (
            <button
              type="button"
              onClick={() =>
                fetchThreads({ cursor: threadsCursor, append: true })
              }
              className="mt-4 w-full px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50"
            >
              {threadsLoadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col min-h-[420px]">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
          </div>

          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {messagesHasMore && (
              <button
                type="button"
                onClick={() =>
                  fetchMessages(selected.otherUserId, selected.listingId, {
                    cursor: messagesCursor,
                    append: true,
                  })
                }
                disabled={messagesLoadingMore}
                className="w-full px-4 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-60"
              >
                {messagesLoadingMore ? "Loading..." : "Load older messages"}
              </button>
            )}
            {loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !selected.otherUserId || !selected.listingId ? (
              <p className="text-gray-500">Select a guest to view the conversation.</p>
            ) : messages.length === 0 ? (
              <p className="text-gray-500">No messages yet. Start the conversation.</p>
            ) : (
              (() => {
                let lastDate = "";
                return messages.map((message) => {
                  const senderId = getUserId(message.sender);
                  const isOwn = senderId === user.id;
                  const dateLabel = new Date(message.createdAt).toLocaleDateString();
                  const showDate = dateLabel !== lastDate;
                  lastDate = dateLabel;
                  return (
                    <div key={message._id}>
                      {showDate && (
                        <div className="text-center text-xs text-gray-400 my-3">
                          {dateLabel}
                        </div>
                      )}
                      <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                        {!isOwn && (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                            {typeof message.sender === "object" && message.sender?.profilePicture ? (
                              <img
                                src={normalizeMediaUrl(message.sender.profilePicture)}
                                alt="sender"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (typeof message.sender === "object" ? message.sender?.fullName?.charAt(0) : "U") || "U"
                            )}
                          </div>
                        )}
                        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                          {!isOwn && typeof message.sender === "object" && message.sender?.fullName && (
                            <p className="text-xs font-semibold text-gray-600 mb-1">{message.sender.fullName}</p>
                          )}
                          <div
                            onContextMenu={(e) => {
                              if (!message.isDeleted) {
                                handleContextMenu(e, message._id, isOwn);
                              }
                            }}
                            className={`w-fit max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2 text-sm break-words ${!message.isDeleted ? "cursor-context-menu" : "cursor-default"
                              } ${isOwn
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-100 text-gray-800"
                              } ${message.isDeleted ? "opacity-60 italic pointer-events-none" : ""}`}
                          >
                            <>
                              {!message.isDeleted && message.media && message.media.length > 0 && (
                                <div className="space-y-2 mb-2">
                                  {message.media.map((item, index) => (
                                    <div key={`${item.url}-${index}`}>
                                      {item.kind === "image" ? (
                                        <img
                                          src={normalizeMediaUrl(item.url)}
                                          alt={item.fileName || "attachment"}
                                          className="max-h-64 rounded-lg border border-white/20"
                                        />
                                      ) : (
                                        <video
                                          src={normalizeMediaUrl(item.url)}
                                          controls
                                          className="max-h-64 rounded-lg border border-white/20"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {message.isDeleted ? (
                                <p className="italic text-current opacity-75">This message has been deleted</p>
                              ) : (
                                message.content && <p>{message.content}</p>
                              )}
                              <div className="flex items-center justify-between mt-1 gap-2">
                                <p className={`text-xs ${isOwn ? "text-emerald-100" : "text-gray-500"}`}>
                                  {new Date(message.createdAt).toLocaleString()}
                                  {message.isEdited && !message.isDeleted && " (edited)"}
                                </p>
                              </div>
                            </>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-gray-200 p-4">
            {draft.trim() && (
              <div className="text-xs text-gray-500 mb-2">Typing...</div>
            )}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-3">
                {attachments.map((item, index) => (
                  <div key={`${item.file.name}-${index}`} className="relative">
                    {item.kind === "image" ? (
                      <img
                        src={item.url}
                        alt={item.file.name}
                        className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-800 text-white text-xs"
                      aria-label="Remove attachment"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                multiple
                onChange={(event) => {
                  if (event.target.files) {
                    handleAttachFiles(event.target.files);
                    event.target.value = "";
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Attach
              </button>
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submitMessage();
                  }
                }}
                placeholder={
                  selected.otherUserId && selected.listingId
                    ? editingMessageId
                      ? "Edit your message..."
                      : "Type your message..."
                    : "Select a guest to start chatting"
                }
                disabled={!selected.otherUserId || !selected.listingId || uploading}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={
                  (!draft.trim() && attachments.length === 0) ||
                  !selected.otherUserId ||
                  !selected.listingId ||
                  uploading
                }
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:bg-emerald-300"
              >
                {uploading ? "Uploading..." : "Send"}
              </button>
            </div>
          </form>

          {/* Context Menu */}
          <ContextMenu
            isOpen={contextMenu.isOpen}
            x={contextMenu.x}
            y={contextMenu.y}
            isOwnMessage={contextMenu.isOwnMessage}
            onClose={() =>
              setContextMenu({ isOpen: false, x: 0, y: 0, messageId: "", isOwnMessage: false })
            }
            onCopy={handleCopyMessage}
            onEdit={() => {
              const messageToEdit = messages.find((msg) => msg._id === contextMenu.messageId);
              if (messageToEdit) {
                if (messageToEdit.media && messageToEdit.media.length > 0) {
                  setToast({ message: "Media messages cannot be edited", type: "info" });
                  setContextMenu({ isOpen: false, x: 0, y: 0, messageId: "", isOwnMessage: false });
                  return;
                }
                setEditingMessageId(contextMenu.messageId);
                setEditOriginal(messageToEdit.content);
                setDraft(messageToEdit.content);
                setAttachments((prev) => {
                  prev.forEach((item) => URL.revokeObjectURL(item.url));
                  return [];
                });
              }
              setContextMenu({ isOpen: false, x: 0, y: 0, messageId: "", isOwnMessage: false });
            }}
            onDelete={() => {
              console.log("Delete option clicked from context menu");
              setDeleteConfirm({ isOpen: true, messageId: contextMenu.messageId });
              setContextMenu({ isOpen: false, x: 0, y: 0, messageId: "", isOwnMessage: false });
            }}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmModal
            isOpen={deleteConfirm.isOpen}
            onClose={() => setDeleteConfirm({ isOpen: false, messageId: "" })}
            onDeleteForMe={handleDeleteForMe}
            onDeleteForEveryone={handleDeleteForEveryone}
          />

          {/* Toast Notification */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
