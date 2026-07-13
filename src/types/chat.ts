// Chat system types and interfaces

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  lastActive: Date;
  role: "student" | "mentor" | "moderator";
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "file" | "system";
  isEdited?: boolean;
  editedAt?: Date;
  replyTo?: string; // ID of message being replied to
  imageUrl?: string; // For image messages
  fileName?: string; // For file messages
  fileSize?: number; // For file messages
}

export interface ChatRoom {
  id: string;
  name: string;
  type: "group" | "mentor-student" | "private";
  description?: string;
  participants: User[];
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  moderatorId?: string; // For group discussions
  maxParticipants?: number; // For group discussions
}

export interface DiscussionGroup extends ChatRoom {
  topic: string;
  moderator: User;
  nextSession?: Date;
  tags: string[];
  isJoined: boolean;
}

export interface MentorSession extends ChatRoom {
  mentor: User;
  student: User;
  sessionNotes?: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  scheduledAt?: Date;
  duration?: number; // in minutes
}

export interface ChatState {
  currentUser: User | null;
  activeChatRoom: ChatRoom | null;
  discussionGroups: DiscussionGroup[];
  mentorSessions: MentorSession[];
  isConnected: boolean;
  isTyping: { [roomId: string]: string[] }; // Users currently typing
}

export interface MentorCredentials {
  email: string;
  password: string;
}

export interface MentorAuth {
  isAuthenticated: boolean;
  mentor: User | null;
  assignedStudents: User[];
}

// Event types for real-time communication
export type ChatEvent =
  | { type: "message_sent"; payload: { roomId: string; message: Message } }
  | { type: "user_joined"; payload: { roomId: string; user: User } }
  | { type: "user_left"; payload: { roomId: string; userId: string } }
  | { type: "typing_start"; payload: { roomId: string; userId: string } }
  | { type: "typing_stop"; payload: { roomId: string; userId: string } }
  | {
      type: "message_edited";
      payload: { roomId: string; messageId: string; newContent: string };
    }
  | {
      type: "user_status_change";
      payload: { userId: string; status: User["status"] };
    };

// Mock data for development
export const MOCK_USERS: User[] = [
  {
    id: "user-1",
    name: "Priya Sharma",
    avatar: "👩‍🎓",
    status: "online",
    lastActive: new Date(),
    role: "student",
  },
  {
    id: "user-2",
    name: "Rohit Kumar",
    avatar: "👨‍💻",
    status: "online",
    lastActive: new Date(Date.now() - 300000), // 5 minutes ago
    role: "student",
  },
  {
    id: "user-3",
    name: "Sneha Patel",
    avatar: "👩‍💼",
    status: "away",
    lastActive: new Date(Date.now() - 900000), // 15 minutes ago
    role: "student",
  },
  {
    id: "mentor-1",
    name: "Arjun Patel",
    avatar: "👨‍🎓",
    status: "online",
    lastActive: new Date(),
    role: "mentor",
  },
  {
    id: "moderator-1",
    name: "Dr. Sharma",
    avatar: "👨‍⚕️",
    status: "online",
    lastActive: new Date(),
    role: "moderator",
  },
];

export const TEST_MENTOR_CREDENTIALS: MentorCredentials = {
  email: "mentor@nexus.com",
  password: "mentor123",
};
