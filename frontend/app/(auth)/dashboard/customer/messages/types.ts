export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
}

export interface Message {
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
  content: string;
  status: MessageStatus;
  read: boolean;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedFor: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageThread {
  otherUserId: string;
  otherUserName: string;
  listingId: string;
  listingTitle?: string;
  lastMessage: Message;
  unreadCount: number;
}

export interface SocketMessage {
  tempId?: string;
  message?: Message;
  messageId?: string;
  status?: MessageStatus;
  deleteType?: string;
  error?: string;
  userId?: string;
  listingId?: string;
}
