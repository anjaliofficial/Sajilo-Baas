"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { format } from "date-fns";
import axios from "@/lib/api/axios";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Trash,
  Edit,
  Paperclip,
  X,
  ImageIcon,
  Video,
} from "lucide-react";
import {
  getSocket,
  initSocket,
  sendMessage,
  startTyping,
  stopTyping,
} from "@/lib/api/socket-client";

// Types
interface User {
  id?: string;
  _id?: string;
  name?: string;
  avatar?: string;
  email?: string;
  profilePicture?: string;
}

interface MediaItem {
  url: string;
  mimeType: string;
  kind: "image" | "video";
  fileName?: string;
}

interface Message {
  _id?: string;
  id?: string;
  tempId?: string;
  content: string;
  sender: User | string;
  receiver: User | string;
  listingId?: string;
  createdAt?: string;
  updatedAt?: string;
  sending?: boolean;
  media?: MediaItem[];
  type?: "text" | "media";
  isDeleted?: boolean;
  isEdited?: boolean;
  read?: boolean;
  deletedFor?: string[];
}

interface Thread {
  id: string;
  otherUserId: string;
  otherUserName?: string;
  otherUserImage?: string;
  listingId: string;
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
}

interface Selected {
  otherUserId: string;
  listingId: string;
  hostId: string;
}

interface AttachmentPreview {
  file: File;
  preview: string;
  kind: "image" | "video";
}

// Helper to get user ID from string or object
const getUserId = (u: User | string | undefined): string | undefined => {
  if (!u) return undefined;
  if (typeof u === "string") return u;
  if (u.id) return u.id;
  // In case backend returns _id instead of id
  if ((u as any)._id) return (u as any)._id;
  return undefined;
};

// Helper to normalize user strings to objects
const normalizeUser = (u: User | string | undefined): User | undefined => {
  if (!u) return undefined;
  if (typeof u === "string") return { id: u };

  // Ensure user has an id field - convert _id to id if needed
  if (!u.id && (u as any)._id) {
    console.log("[normalizeUser] Converting _id to id:", (u as any)._id);
    return { ...u, id: (u as any)._id };
  }
  return u;
};

// Helper to normalize messages
const normalizeMessage = (msg: Message): Message => {
  return {
    ...msg,
    sender: normalizeUser(msg.sender) || msg.sender,
    receiver: normalizeUser(msg.receiver) || msg.receiver,
  };
};

// Normalize media URLs
const normalizeMediaUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/uploads/")) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050"}${url}`;
  }
  return `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050"}/uploads/${url}`;
};

const MessageApp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ id: string; name?: string } | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Selected>({
    otherUserId: "",
    listingId: "",
    hostId: "",
  });

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messagesLoadingMore, setMessagesLoadingMore] = useState(false);
  const [threadsLoadingMore, setThreadsLoadingMore] = useState(false);

  // Log component mount
  useEffect(() => {
    console.log("[COMPONENT] MessageApp mounted");
    return () => console.log("[COMPONENT] MessageApp unmounted");
  }, []);

  const [threadsCursor, setThreadsCursor] = useState<string | null>(null);
  const [threadsHasMore, setThreadsHasMore] = useState(false);
  const [messagesCursor, setMessagesCursor] = useState<string | null>(null);
  const [messagesHasMore, setMessagesHasMore] = useState(false);

  const [messageInput, setMessageInput] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    message: Message | null;
  }>({
    open: false,
    x: 0,
    y: 0,
    message: null,
  });
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    message: Message | null;
  }>({ open: false, message: null });

  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const threadPageSize = 15;
  const messagePageSize = 20;

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load user profile
  useEffect(() => {
    console.log("[USER] Starting fetchUser...");
    const fetchUser = async () => {
      try {
        console.log("[USER] Calling /auth/me");
        const response = await axios.get("/auth/me", {
          withCredentials: true,
        });
        console.log("[USER] Response received:", response.data);
        // Response is { success: true, user: {...} }
        let userData = response.data.user || response.data.data || response.data;
        // Ensure we have an id field (backend uses _id)
        if (userData && !userData.id && userData._id) {
          userData = { ...userData, id: userData._id };
        }
        console.log("[USER] Setting user state with id:", userData?.id, userData);
        // Ensure user is normalized with id field
        const normalizedUser = normalizeUser(userData);
        console.log("[USER] Normalized user:", normalizedUser);
        setUser(normalizedUser || userData);
      } catch (error) {
        console.error("[USER] Error loading user:", error);
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  // Auto-select from query params
  useEffect(() => {
    const hostId = searchParams.get("hostId") || "";
    const listingId = searchParams.get("listingId") || "all";

    if (hostId) {
      setSelected({ otherUserId: hostId, listingId, hostId });
    }
  }, [searchParams]);

  // Fetch threads
  const fetchThreads = async (options?: { cursor?: string | null; append?: boolean }) => {
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
      const url = `/messages/threads?${params.toString()}`;
      console.log("[fetchThreads] Calling:", url);

      const response = await axios.get(url, {
        withCredentials: true,
      });
      const data = response.data;
      console.log("[fetchThreads] Response status:", response.status);
      console.log("[fetchThreads] Response data:", JSON.stringify(data, null, 2));

      // Handle both response formats - check if threads exist
      const threads = data.threads || data.data?.threads || data.data || [];
      console.log("[fetchThreads] Extracted threads:", threads);

      if (!Array.isArray(threads)) {
        console.warn("[fetchThreads] Threads is not an array:", threads);
        if (!append) setThreads([]);
        return;
      }

      const items = threads.map((thread: any) => {
        console.log("[fetchThreads] Processing thread:", thread);
        const mapped = {
          id: `${String(thread.otherUserId)}_${String(thread.listingId)}`,
          otherUserId: String(thread.otherUserId),
          otherUserName: thread.otherUserName || "Host",
          otherUserImage: thread.otherUserImage,
          listingId: thread.listingId ? String(thread.listingId) : "all",
          title: thread.otherUserName || "Host",
          lastMessage: thread.lastMessage?.type === "media"
            ? (thread.lastMessage?.media && thread.lastMessage.media.length > 0 ? "Attachment" : thread.lastMessage?.content || "")
            : (thread.lastMessage?.content || ""),
          lastMessageAt: thread.lastMessage?.createdAt || "",
          unread: Boolean(thread.unreadCount && thread.unreadCount > 0),
        };
        console.log("[fetchThreads] Mapped thread:", mapped);
        return mapped;
      });

      console.log("[fetchThreads] Mapped items:", items.length, items);
      setThreads((prev) => {
        const result = append ? [...prev, ...items] : items;
        console.log("[fetchThreads] Updated threads count:", result.length);
        return result;
      });
      setThreadsCursor(data.nextCursor || null);
      setThreadsHasMore(Boolean(data.nextCursor));
      console.log("[fetchThreads] Done setting state");
    } catch (error: any) {
      console.error("Error fetching threads:", error);
      if (!append) {
        setThreads([]);
        if (!(error?.message || "").includes("Failed to load conversations")) {
          console.error("[fetchThreads] Detailed error:", error);
        }
      }
    } finally {
      if (append) {
        setThreadsLoadingMore(false);
      } else {
        setThreadsLoading(false);
      }
    }
  };

  // Load threads on component mount
  useEffect(() => {
    if (!user) return;
    fetchThreads();
  }, [user]);

  // Auto-select first thread if none selected
  useEffect(() => {
    const hasQuery =
      searchParams.get("hostId") ||
      searchParams.get("otherUserId") ||
      searchParams.get("listingId");
    if (hasQuery) {
      console.log("[AUTO-SELECT] Has query params, skipping auto-select");
      return;
    }

    const hasSelectedThread = selected.otherUserId && selected.listingId;
    if (hasSelectedThread) {
      console.log("[AUTO-SELECT] Already have selected thread:", selected);
      return;
    }
    if (threads.length === 0) {
      console.log("[AUTO-SELECT] No threads available yet");
      return;
    }

    console.log("[AUTO-SELECT] Auto-selecting first thread:", {
      otherUserId: threads[0].otherUserId,
      listingId: threads[0].listingId,
    });
    setSelectedThread({
      otherUserId: threads[0].otherUserId,
      listingId: threads[0].listingId,
    });
  }, [threads, selected.otherUserId, selected.listingId, searchParams]);

  // Navigate to thread and update URL
  const setSelectedThread = (thread: { otherUserId: string; listingId: string }) => {
    setSelected({ ...thread, hostId: thread.otherUserId });
    const params = new URLSearchParams();
    if (thread.otherUserId) params.set("hostId", thread.otherUserId);
    // Always include listingId, even if it's "all"
    params.set("listingId", thread.listingId || "all");
    const query = params.toString();
    router.replace(query ? `/dashboard/customer/messages?${query}` : "/dashboard/customer/messages");
  };

  // Mark thread as read
  const markThreadRead = async (thread: { otherUserId: string; listingId: string }) => {
    try {
      await axios.patch("/messages/read",
        {
          otherUserId: thread.otherUserId,
          listingId: thread.listingId,
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Fetch messages for selected thread
  const fetchMessages = async (
    hostId: string,
    listingId: string,
    options?: { cursor?: string | null; append?: boolean }
  ) => {
    const normalizedListingId = !listingId || listingId === "all" ? "all" : listingId;
    if (!hostId) {
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
      const url = `/messages/${hostId}/${normalizedListingId}?${params.toString()}`;
      console.log("[fetchMessages] Calling:", url);

      const response = await axios.get(url, {
        withCredentials: true
      });
      const data = response.data;
      console.log("[fetchMessages] Response status:", response.status);
      console.log("[fetchMessages] Response data:", JSON.stringify(data, null, 2));

      // Handle multiple response formats
      let list: Message[] = [];
      console.log("[fetchMessages] Checking response formats...");
      console.log("[fetchMessages] Is array?", Array.isArray(data));
      console.log("[fetchMessages] data.data is array?", Array.isArray(data?.data));
      console.log("[fetchMessages] data.messages is array?", Array.isArray(data?.messages));

      if (Array.isArray(data)) {
        console.log("[fetchMessages] Using data as array");
        list = data;
      } else if (Array.isArray(data?.data)) {
        console.log("[fetchMessages] Using data.data as array");
        list = data.data;
      } else if (data?.success && Array.isArray(data?.messages)) {
        console.log("[fetchMessages] Using data.messages as array");
        list = data.messages;
      } else {
        console.warn("[fetchMessages] Could not find messages in response. Full response:", data);
      }

      console.log("[fetchMessages] Final list length:", list.length);

      // Define normalized BEFORE using it
      const normalized = list.map((message: Message) => normalizeMessage(message));
      console.log("[fetchMessages] Normalized messages:", normalized);

      setMessages((prev) => {
        const result = append ? [...normalized, ...prev] : normalized;
        console.log("[fetchMessages] State updated. Total messages:", result.length);
        if (result.length === 0) {
          console.warn("[fetchMessages] WARNING: No messages in state! Normalized was:", normalized);
        }
        return result;
      });
      setMessagesCursor(data.nextCursor || null);
      setMessagesHasMore(Boolean(data.nextCursor));

      if (!append) {
        // Mark thread as read
        axios.patch("/messages/read", { otherUserId: hostId, listingId: normalizedListingId }, { withCredentials: true }).catch(e => console.error("Failed to mark as read", e));
        setThreads((prev) =>
          prev.map((thread) =>
            thread.otherUserId === hostId && thread.listingId === normalizedListingId
              ? { ...thread, unread: false }
              : thread
          )
        );
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      if (!append) {
        setMessages([]);
        if (!(error?.message || "").includes("Failed to load messages")) {
          alert(`Error loading messages: ${error?.message || "Unknown error"}`);
        }
      }
    } finally {
      if (append) {
        setMessagesLoadingMore(false);
      } else {
        setLoadingMessages(false);
      }
    }
  };

  // Auto-fetch messages when thread is selected
  useEffect(() => {
    if (!selected.otherUserId || !selected.listingId) {
      console.log("[AUTO-FETCH] Not fetching - missing selected values:", selected);
      return;
    }
    console.log("[AUTO-FETCH] Triggering fetchMessages for thread:", selected);
    fetchMessages(selected.otherUserId, selected.listingId);
  }, [selected.otherUserId, selected.listingId]);

  // Initialize socket
  useEffect(() => {
    if (!user) {
      console.log("[SOCKET] Not initializing - no user");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[SOCKET] Not initializing - no token");
      router.push("/login");
      return;
    }

    console.log("[SOCKET] Initializing socket for user:", user.id);
    initSocket(token);
    const newSocket = getSocket();

    if (!newSocket) {
      console.error("[SOCKET] Failed to get socket instance");
      return;
    }

    console.log("[SOCKET] Socket initialized successfully");

    // Socket event listeners
    newSocket?.on("receiveMessage", (message: Message) => {
      console.log("[receiveMessage] Event received with message:", message);
      console.log("[receiveMessage] Current selected thread:", selected);

      // Only add message if it's from the currently selected thread
      const senderId = getUserId(message.sender);
      const messageListingId = message.listingId || "all";
      const normalizedListingId = selected.listingId || "all";

      console.log("[receiveMessage] Checking filters:");
      console.log("[receiveMessage]   senderId:", senderId, "vs selected.otherUserId:", selected.otherUserId);
      console.log("[receiveMessage]   messageListingId:", messageListingId, "vs normalizedListingId:", normalizedListingId);
      console.log("[receiveMessage]   Match?", senderId === selected.otherUserId && messageListingId === normalizedListingId);

      if (senderId === selected.otherUserId && messageListingId === normalizedListingId) {
        console.log("[receiveMessage] Adding message to current view");
        setMessages((prev) => [...prev, normalizeMessage({ ...message, sending: false })]);
      } else {
        console.log("[receiveMessage] Message from different thread, not adding to current view");
      }
    });

    newSocket?.on("messageSent", (data: any) => {
      console.log("messageSent event:", data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === data.tempId
            ? {
              ...normalizeMessage(data.message),
              tempId: data.tempId,
              sending: false,
            }
            : msg
        )
      );
    });

    newSocket?.on("messageDeleted", (data: { messageId: string }) => {
      console.log("messageDeleted event:", data);
      setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
    });

    newSocket?.on("messageUpdated", (data: { message: Message }) => {
      console.log("messageUpdated event:", data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.message._id ? normalizeMessage(data.message) : msg
        )
      );
    });

    newSocket?.on("typing", (data: { userId: string; otherUserId?: string; listingId?: string }) => {
      console.log("typing event:", data);
      // Show typing indicator if it's from the other user in current conversation
      if (data.userId === selected.otherUserId) {
        setIsOtherUserTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherUserTyping(false);
        }, 3000);
      }
    });

    newSocket?.on("stopTyping", (data: { userId: string; otherUserId?: string; listingId?: string }) => {
      console.log("stopTyping event:", data);
      if (data.userId === selected.otherUserId) {
        setIsOtherUserTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    });

    return () => {
      newSocket?.off("receiveMessage");
      newSocket?.off("messageSent");
      newSocket?.off("messageDeleted");
      newSocket?.off("messageUpdated");
      newSocket?.off("typing");
      newSocket?.off("stopTyping");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, router, selected.otherUserId, selected.listingId]);

  // Auto-scroll to bottom of messages (but only when not loading more)
  useEffect(() => {
    if (!messagesContainerRef.current || messagesLoadingMore) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages, messagesLoadingMore, isOtherUserTyping]);

  // Handle file attachment
  const handleAttachFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const newAttachments: AttachmentPreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        alert(`File ${file.name} is not a supported image or video type`);
        continue;
      }
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds 10MB size limit`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      const kind = file.type.startsWith("image/") ? "image" : "video";
      newAttachments.push({ file, preview, kind });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Upload attachments
  const uploadAttachments = async (files: File[]): Promise<MediaItem[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      console.log("[Upload] Uploading files:", files.map(f => ({ name: f.name, size: f.size })));
      const response = await axios.post("/files/upload-files", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("[Upload] Response:", response.data);

      // Handle different response formats
      const uploadedFiles = response.data.files || response.data.data || [];
      if (!Array.isArray(uploadedFiles)) {
        throw new Error("Invalid response format: files not an array");
      }

      return uploadedFiles.map((f: any) => ({
        url: f.path || f.url,
        mimeType: f.mimeType || f.mimetype,
        kind: (f.mimeType || f.mimetype || "").startsWith("image/") ? "image" : "video",
        fileName: f.filename || f.originalname || f.fileName,
      }));
    } catch (error: any) {
      console.error("[Upload] Error details:", {
        message: error.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw new Error(error?.response?.data?.message || error.message || "Upload failed");
    }
  };

  // Handle input changes and emit typing events
  const handleInputChange = (value: string) => {
    setMessageInput(value);
    // Emit typing event
    if (value.trim()) {
      startTyping(selected.otherUserId, selected.listingId);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content && attachments.length === 0) return;
    if (!selected.otherUserId || !selected.listingId) return;
    if (!user) return;

    // Stop typing when sending message
    stopTyping(selected.otherUserId, selected.listingId);

    const tempId = `temp_${Date.now()}`;
    let mediaItems: MediaItem[] = [];

    // Upload attachments if any
    if (attachments.length > 0) {
      try {
        mediaItems = await uploadAttachments(attachments.map((a) => a.file));
        // Clean up preview URLs
        attachments.forEach((a) => URL.revokeObjectURL(a.preview));
        setAttachments([]);
      } catch (error: any) {
        console.error("Upload error:", error);
        alert(`Failed to upload attachments: ${error.message}`);
        return;
      }
    }

    // Optimistic UI update
    const optimisticMessage: Message = {
      tempId,
      content,
      sender: { id: user.id, name: user.name },
      receiver: { id: selected.otherUserId },
      listingId: selected.listingId,
      createdAt: new Date().toISOString(),
      sending: true,
      media: mediaItems,
      type: mediaItems.length > 0 ? "media" : "text",
    };

    console.log("[DEBUG] Optimistic message sender:", optimisticMessage.sender, "User ID:", user.id);
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput("");

    // Send via socket
    if (editingMessage) {
      // Editing not allowed for media messages
      setEditingMessage(null);
    } else {
      sendMessage({
        receiverId: selected.otherUserId,
        listingId: selected.listingId,
        content: content || undefined,
        media: mediaItems.length > 0 ? mediaItems : undefined,
        tempId,
      });
    }
  };

  // Edit message
  const handleEdit = (message: Message) => {
    if (message.media && message.media.length > 0) {
      alert("Cannot edit messages with attachments");
      return;
    }
    setEditingMessage(message);
    setMessageInput(message.content);
    setContextMenu({ open: false, x: 0, y: 0, message: null });
  };

  // Update message
  const handleUpdateMessage = async () => {
    if (!editingMessage) return;
    const content = messageInput.trim();
    if (!content) return;

    // Stop typing when updating message
    stopTyping(selected.otherUserId, selected.listingId);

    try {
      await axios.put(`/messages/${editingMessage._id}`,
        { content },
        { withCredentials: true }
      );

      setMessageInput("");
      setEditingMessage(null);
    } catch (error: any) {
      console.error("Error updating message:", error);
      alert(error?.response?.data?.message || "Failed to update message");
    }
  };

  // Delete message
  const handleDelete = (message: Message) => {
    setDeleteModal({ open: true, message });
    setContextMenu({ open: false, x: 0, y: 0, message: null });
  };

  const confirmDelete = async (deleteType: "for_me" | "for_everyone") => {
    if (!deleteModal.message) return;

    const msg = deleteModal.message;

    // Don't delete temp messages that haven't been saved yet
    if (!msg._id) {
      setMessages((prev) => prev.filter((m) => m.tempId !== msg.tempId));
      setDeleteModal({ open: false, message: null });
      return;
    }

    try {
      const messageId = msg._id.toString().trim();
      console.log("[DELETE] Attempting to delete message:", {
        messageId,
        deleteType,
        msgId: msg._id,
        url: `/messages/${messageId}`,
      });

      const response = await axios.delete(`/messages/${messageId}`, {
        data: { deleteType },
        withCredentials: true,
      });

      console.log("[DELETE] Success response:", response.data);

      // Update local state based on delete type
      if (deleteType === "for_me") {
        // Remove only from current user's view
        setMessages((prev) =>
          prev.map((m) =>
            m._id === msg._id
              ? { ...m, isDeleted: true, deletedFor: [user?.id || ""] }
              : m
          )
        );
      } else {
        // Remove completely for everyone
        setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      }

      setDeleteModal({ open: false, message: null });
    } catch (error: any) {
      console.error("[DELETE] Error response:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error.message,
        messageId: msg._id,
      });
      alert(error?.response?.data?.message || "Failed to delete message");
    }
  };

  // Handle scroll for loading more threads
  const handleThreadsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (bottom && threadsHasMore && !threadsLoadingMore) {
      fetchThreads({ cursor: threadsCursor, append: true });
    }
  };

  // Handle scroll for loading more messages
  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const atTop = target.scrollTop === 0;
    if (atTop && messagesHasMore && !messagesLoadingMore) {
      const prevHeight = target.scrollHeight;
      fetchMessages(selected.otherUserId, selected.listingId, {
        cursor: messagesCursor,
        append: true,
      }).then(() => {
        // Maintain scroll position after loading older messages
        setTimeout(() => {
          const newHeight = target.scrollHeight;
          target.scrollTop = newHeight - prevHeight;
        }, 0);
      });
    }
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };

  // Close context menu
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.open) {
        setContextMenu({ open: false, x: 0, y: 0, message: null });
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu.open]);

  // Debug logging
  useEffect(() => {
    console.log("[Render] user state:", user);
  }, [user]);

  useEffect(() => {
    console.log("[Render] threads state:", threads);
  }, [threads]);

  useEffect(() => {
    console.log("[Render] messages state:", messages);
    console.log("[Render] selected thread:", selected);
    console.log("[Render] loading messages:", loadingMessages);
  }, [messages, selected]);
  return (
    <div className="h-screen flex bg-gray-50">
      {/* Threads Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
          {user && <p className="text-xs text-gray-500 mt-1">Logged in as: {user.name}</p>}
        </div>

        <div
          className="flex-1 overflow-y-auto"
          onScroll={handleThreadsScroll}
        >
          {threadsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : threads.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500 mb-3">No conversations yet</p>
              <p className="text-xs text-gray-400">
                Start a booking to begin messaging with hosts or guests
              </p>
            </div>
          ) : (
            <>
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() =>
                    setSelectedThread({
                      otherUserId: thread.otherUserId,
                      listingId: thread.listingId,
                    })
                  }
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selected.otherUserId === thread.otherUserId &&
                    selected.listingId === thread.listingId
                    ? "bg-blue-50"
                    : ""
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {thread.otherUserImage ? (
                        <img
                          src={normalizeMediaUrl(thread.otherUserImage)}
                          alt={thread.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        thread.otherUserName?.charAt(0)?.toUpperCase() || "H"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-800">{thread.title}</h3>
                        {thread.unread && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {thread.lastMessage || "No messages yet"}
                      </p>
                      {thread.lastMessageAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(thread.lastMessageAt), "MMM d, h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {threadsLoadingMore && (
                <div className="p-4 text-center text-gray-500">Loading more...</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 flex flex-col">
        {!selected.otherUserId ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">
                {threads.find(
                  (t) =>
                    t.otherUserId === selected.otherUserId &&
                    t.listingId === selected.listingId
                )?.title || "Host"}
              </h2>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messagesLoadingMore && (
                <div className="text-center text-gray-500 py-2">
                  Loading older messages...
                </div>
              )}
              {loadingMessages ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet</div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const senderId = getUserId(msg.sender);
                    const isSender = senderId === user?.id;

                    // Debug logging for message direction
                    if (index === 0 || index === messages.length - 1) {
                      console.log("[Message Direction]", {
                        msg_id: msg._id,
                        sender: msg.sender,
                        senderId,
                        user_id: user?.id,
                        isSender,
                        content: msg.content?.substring(0, 20),
                      });
                    }

                    return (
                      <div
                        key={msg._id || msg.tempId || index}
                        className={`flex gap-2 ${isSender ? "justify-end" : "justify-start"}`}
                        onContextMenu={(e) => handleContextMenu(e, msg)}
                      >
                        {!isSender && (
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                            {typeof msg.sender === "object" && msg.sender?.profilePicture ? (
                              <img
                                src={normalizeMediaUrl(msg.sender.profilePicture)}
                                alt="sender"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (typeof msg.sender === "object" ? msg.sender?.name?.charAt(0) : "H") || "H"
                            )}
                          </div>
                        )}
                        <div className={`flex flex-col ${isSender ? "items-end" : "items-start"}`}>
                          {!isSender && typeof msg.sender === "object" && msg.sender?.name && (
                            <p className="text-xs font-semibold text-gray-600 mb-1">{msg.sender.name}</p>
                          )}
                          <div
                            className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${isSender
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-800"
                              } ${msg.sending ? "opacity-50" : ""}`}
                          >
                            {!msg.isDeleted && msg.media && msg.media.length > 0 && (
                              <div className="space-y-2 mb-2">
                                {msg.media.map((item, idx) => {
                                  const fullUrl = normalizeMediaUrl(item.url);
                                  return (
                                    <div key={idx}>
                                      {item.kind === "image" ? (
                                        <img
                                          src={fullUrl}
                                          alt={item.fileName || "image"}
                                          className="rounded max-w-full"
                                          style={{ maxHeight: "300px", maxWidth: "100%" }}
                                        />
                                      ) : (
                                        <video
                                          src={fullUrl}
                                          controls
                                          className="rounded max-w-full"
                                          style={{ maxHeight: "300px" }}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {msg.isDeleted ? (
                              <p className="italic text-gray-500">This message was deleted</p>
                            ) : (
                              msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                            {msg.createdAt && (
                              <p
                                className={`text-xs mt-1 ${isSender ? "text-blue-100" : "text-gray-500"
                                  }`}
                              >
                                {format(new Date(msg.createdAt), "h:mm a")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isOtherUserTyping && (
                    <div className="flex justify-start gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex-shrink-0"></div>
                      <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              {editingMessage && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded flex justify-between items-center">
                  <span className="text-sm text-yellow-800">Editing message</span>
                  <button
                    onClick={() => {
                      setEditingMessage(null);
                      setMessageInput("");
                    }}
                    className="text-yellow-800 hover:text-yellow-900"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative">
                      {att.kind === "image" ? (
                        <Image
                          src={att.preview}
                          alt="preview"
                          width={80}
                          height={80}
                          className="rounded border border-gray-300"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                          <Video size={32} className="text-gray-600" />
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleAttachFiles(e.target.files)}
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
                  title="Attach files"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (editingMessage) {
                        handleUpdateMessage();
                      } else {
                        handleSendMessage();
                      }
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={editingMessage ? handleUpdateMessage : handleSendMessage}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.open && contextMenu.message && (
        <div
          className="fixed bg-white border border-gray-300 rounded shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {getUserId(contextMenu.message.sender) === user?.id && (
            <>
              {(!contextMenu.message.media || contextMenu.message.media.length === 0) && (
                <button
                  onClick={() => handleEdit(contextMenu.message!)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
              )}
              <button
                onClick={() => handleDelete(contextMenu.message!)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
              >
                <Trash size={16} />
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setDeleteModal({ open: false, message: null })}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-700 animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="px-6 py-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Delete message?</h2>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-gray-300 text-sm">
                  Choose how you want to delete this message.
                </p>
              </div>

              {/* Buttons */}
              <div className="px-6 py-4 border-t border-gray-700 space-y-3">
                <button
                  onClick={() => confirmDelete("for_everyone")}
                  className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Delete for everyone
                </button>

                <button
                  onClick={() => confirmDelete("for_me")}
                  className="w-full px-4 py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors"
                >
                  Delete for me
                </button>

                <button
                  onClick={() => setDeleteModal({ open: false, message: null })}
                  className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageApp;
