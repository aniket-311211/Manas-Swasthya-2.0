import { createContext, useContext } from "react";
import {
  ChatState,
  ChatRoom,
  MentorSession,
  DiscussionGroup,
} from "@/types/chat";

// Action types
export type ChatAction =
  | { type: "SET_CURRENT_USER"; payload: any } // Using any temporarily to avoid circular dependency if User is complex, but ideally it's from @/types/chat
  | { type: "SET_ACTIVE_CHAT_ROOM"; payload: ChatRoom | null }
  | { type: "ADD_MESSAGE"; payload: { roomId: string; message: any } }
  | { type: "JOIN_DISCUSSION_GROUP"; payload: DiscussionGroup }
  | { type: "LEAVE_DISCUSSION_GROUP"; payload: string }
  | { type: "CREATE_MENTOR_SESSION"; payload: MentorSession }
  | { type: "UPDATE_MENTOR_SESSION"; payload: MentorSession }
  | {
      type: "UPDATE_TYPING";
      payload: { roomId: string; userId: string; isTyping: boolean };
    }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "LOAD_DISCUSSION_GROUPS"; payload: DiscussionGroup[] }
  | {
      type: "UPDATE_USER_STATUS";
      payload: { userId: string; status: any };
    };

export const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (roomId: string, content: string) => void;
  sendImageMessage: (roomId: string, imageFile: File) => Promise<void>;
  joinDiscussionGroup: (groupId: string) => void;
  leaveDiscussionGroup: (groupId: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  setActiveRoom: (room: ChatRoom | null) => void;
  createMentorSession: (session: MentorSession) => void;
  updateMentorSession: (session: MentorSession) => void;
} | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
