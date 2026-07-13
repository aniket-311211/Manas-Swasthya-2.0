/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

// Types
export interface Mentor {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    specialization: string;
    badge: string;
    status: 'online' | 'offline' | 'away';
    totalSessions: number;
    rating: number;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    timestamp: Date;
    role: 'user' | 'mentor' | 'system';
}

export interface ChatRoom {
    id: string;
    type: 'mentor' | 'group';
    name: string;
    description?: string;
    mentorId?: string;
    studentId?: string;
    topic?: string;
    messages: ChatMessage[];
}

export interface Event {
    id: string;
    title: string;
    description: string;
    category: string;
    host: string;
    image: string;
    date: string;
    duration: string;
    location: string;
    maxParticipants: number;
    participantCount: number;
    isRegistered: boolean;
}

interface CommunityState {
    mentors: Mentor[];
    currentMentor: Mentor | null;
    isMentorLoggedIn: boolean;
    chatRooms: ChatRoom[];
    currentRoom: ChatRoom | null;
    events: Event[];
    loading: boolean;
    error: string | null;
}

type CommunityAction =
    | { type: 'SET_MENTORS'; payload: Mentor[] }
    | { type: 'MENTOR_LOGIN'; payload: Mentor }
    | { type: 'MENTOR_LOGOUT' }
    | { type: 'SET_CHAT_ROOMS'; payload: ChatRoom[] }
    | { type: 'SET_CURRENT_ROOM'; payload: ChatRoom | null }
    | { type: 'ADD_MESSAGE'; payload: { roomId: string; message: ChatMessage } }
    | { type: 'SET_EVENTS'; payload: Event[] }
    | { type: 'UPDATE_EVENT_REGISTRATION'; payload: { eventId: string; isRegistered: boolean } }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null };

const initialState: CommunityState = {
    mentors: [],
    currentMentor: null,
    isMentorLoggedIn: false,
    chatRooms: [],
    currentRoom: null,
    events: [],
    loading: false,
    error: null,
};

function communityReducer(state: CommunityState, action: CommunityAction): CommunityState {
    switch (action.type) {
        case 'SET_MENTORS':
            return { ...state, mentors: action.payload };
        case 'MENTOR_LOGIN':
            return { ...state, currentMentor: action.payload, isMentorLoggedIn: true };
        case 'MENTOR_LOGOUT':
            return { ...state, currentMentor: null, isMentorLoggedIn: false };
        case 'SET_CHAT_ROOMS':
            return { ...state, chatRooms: action.payload };
        case 'SET_CURRENT_ROOM':
            return { ...state, currentRoom: action.payload };
        case 'ADD_MESSAGE':
            return {
                ...state,
                chatRooms: state.chatRooms.map(room =>
                    room.id === action.payload.roomId
                        ? { ...room, messages: [...room.messages, action.payload.message] }
                        : room
                ),
                currentRoom: state.currentRoom?.id === action.payload.roomId
                    ? { ...state.currentRoom, messages: [...state.currentRoom.messages, action.payload.message] }
                    : state.currentRoom
            };
        case 'SET_EVENTS':
            return { ...state, events: action.payload };
        case 'UPDATE_EVENT_REGISTRATION':
            return {
                ...state,
                events: state.events.map(event =>
                    event.id === action.payload.eventId
                        ? {
                            ...event,
                            isRegistered: action.payload.isRegistered,
                            participantCount: action.payload.isRegistered
                                ? event.participantCount + 1
                                : event.participantCount - 1
                        }
                        : event
                )
            };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
}

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : '';

interface CommunityContextType {
    state: CommunityState;
    loginMentor: (email: string, password: string) => Promise<boolean>;
    logoutMentor: () => Promise<void>;
    fetchMentors: () => Promise<void>;
    fetchChatRooms: (type?: string) => Promise<ChatRoom[]>;
    fetchMessages: (roomId: string, roomData?: ChatRoom) => Promise<void>;
    sendMessage: (roomId: string, content: string) => Promise<void>;
    createMentorRoom: (mentorId: string) => Promise<string | null>;
    setCurrentRoom: (room: ChatRoom | null) => void;
    fetchEvents: () => Promise<void>;
    registerForEvent: (eventId: string) => Promise<void>;
    unregisterFromEvent: (eventId: string) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(communityReducer, initialState);
    const { user } = useUser();

    // Restore mentor session from localStorage
    useEffect(() => {
        const savedMentor = localStorage.getItem('mentorSession');
        if (savedMentor) {
            try {
                const mentor = JSON.parse(savedMentor);
                dispatch({ type: 'MENTOR_LOGIN', payload: mentor });
            } catch (e) {
                localStorage.removeItem('mentorSession');
            }
        }
    }, []);

    const loginMentor = async (email: string, password: string): Promise<boolean> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await fetch(`${API_BASE}/api/mentors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', email, password }),
            });

            if (!response.ok) {
                dispatch({ type: 'SET_ERROR', payload: 'Invalid credentials' });
                return false;
            }

            const envelope = await response.json();
            dispatch({ type: 'MENTOR_LOGIN', payload: envelope.data.mentor });
            localStorage.setItem('mentorSession', JSON.stringify(envelope.data.mentor));
            return true;
        } catch (error) {
            console.error('Login error:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Login failed' });
            return false;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const logoutMentor = async () => {
        if (state.currentMentor) {
            try {
                await fetch(`${API_BASE}/api/mentors`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'logout', mentorId: state.currentMentor.id }),
                });
            } catch (e) {
                console.error('Logout error:', e);
            }
        }
        dispatch({ type: 'MENTOR_LOGOUT' });
        localStorage.removeItem('mentorSession');
    };

    const fetchMentors = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/mentors`);
            if (response.ok) {
                const mentors = await response.json();
                dispatch({ type: 'SET_MENTORS', payload: mentors });
            }
        } catch (error) {
            console.error('Error fetching mentors:', error);
        }
    };

    const fetchChatRooms = async (type?: string): Promise<ChatRoom[]> => {
        try {
            const url = type ? `${API_BASE}/api/chat/rooms?type=${type}` : `${API_BASE}/api/chat/rooms`;
            const response = await fetch(url);
            if (response.ok) {
                const rooms = await response.json();
                // Transform rooms to match our ChatRoom interface
                const transformedRooms: ChatRoom[] = rooms.map((room: Record<string, never> & ChatRoom) => ({
                    id: room.id,
                    type: room.type,
                    name: room.name || 'Chat Room',
                    description: room.description,
                    mentorId: room.mentorId,
                    studentId: room.studentId,
                    topic: room.topic,
                    messages: room.messages || []
                }));
                dispatch({ type: 'SET_CHAT_ROOMS', payload: transformedRooms });
                return transformedRooms;
            }
            return [];
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
            return [];
        }
    };

    const fetchMessages = async (roomId: string, roomData?: ChatRoom) => {
        try {
            const response = await fetch(`${API_BASE}/api/chat/rooms/${roomId}/messages`);
            if (response.ok) {
                const messages = await response.json();
                // Transform messages to add required fields
                const transformedMessages = messages.map((msg: Record<string, never> & { id: string; roomId: string; [k: string]: unknown }) => ({
                    id: msg.id,
                    roomId: msg.roomId,
                    senderId: msg.userId,
                    senderName: msg.senderName || 'User',
                    senderAvatar: msg.senderAvatar || '👤',
                    content: msg.content,
                    timestamp: new Date(msg.timestamp),
                    role: msg.role || 'user'
                }));

                // Use provided room data or create minimal room
                const room = roomData || { id: roomId, type: 'mentor' as const, name: 'Chat', messages: [] };
                dispatch({
                    type: 'SET_CURRENT_ROOM',
                    payload: { ...room, messages: transformedMessages }
                });
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async (roomId: string, content: string) => {
        try {
            const senderName = state.isMentorLoggedIn
                ? state.currentMentor?.name || 'Mentor'
                : user?.firstName || 'Student';
            const senderAvatar = state.isMentorLoggedIn
                ? state.currentMentor?.avatar || '👨‍🎓'
                : '👤';
            const role = state.isMentorLoggedIn ? 'mentor' : 'user';

            const response = await fetch(`${API_BASE}/api/chat/rooms/${roomId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clerkId: user?.id,
                    content,
                    role,
                    senderName,
                    senderAvatar,
                }),
            });

            if (response.ok) {
                const message = await response.json();
                dispatch({
                    type: 'ADD_MESSAGE',
                    payload: {
                        roomId,
                        message: {
                            id: message.id,
                            roomId: message.roomId,
                            senderId: user?.id || 'system',
                            senderName,
                            senderAvatar,
                            content: message.content,
                            timestamp: new Date(message.timestamp),
                            role,
                        },
                    },
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const createMentorRoom = async (mentorId: string): Promise<string | null> => {
        try {
            const response = await fetch(`${API_BASE}/api/chat/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'mentor',
                    name: 'Mentor Session',
                    mentorId,
                    studentId: user?.id,
                }),
            });

            if (response.ok) {
                const roomData = await response.json();

                // Create a properly formatted room object
                const newRoom: ChatRoom = {
                    id: roomData.id,
                    type: 'mentor',
                    name: roomData.name || 'Mentor Session',
                    mentorId: roomData.mentorId,
                    studentId: roomData.studentId,
                    messages: []
                };

                // Add to chat rooms list
                dispatch({ type: 'SET_CHAT_ROOMS', payload: [...state.chatRooms, newRoom] });

                // Set as current room
                dispatch({ type: 'SET_CURRENT_ROOM', payload: newRoom });

                return newRoom.id;
            }
            return null;
        } catch (error) {
            console.error('Error creating room:', error);
            return null;
        }
    };

    const setCurrentRoom = (room: ChatRoom | null) => {
        dispatch({ type: 'SET_CURRENT_ROOM', payload: room });
    };

    const fetchEvents = async () => {
        try {
            const url = user?.id
                ? `${API_BASE}/api/events?userId=${user.id}`
                : `${API_BASE}/api/events`;
            const response = await fetch(url);
            if (response.ok) {
                const events = await response.json();
                dispatch({ type: 'SET_EVENTS', payload: events });
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const registerForEvent = async (eventId: string) => {
        if (!user?.id) return;
        try {
            const response = await fetch(`${API_BASE}/api/events/${eventId}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clerkId: user.id }),
            });

            if (response.ok) {
                dispatch({
                    type: 'UPDATE_EVENT_REGISTRATION',
                    payload: { eventId, isRegistered: true }
                });
            }
        } catch (error) {
            console.error('Error registering for event:', error);
        }
    };

    const unregisterFromEvent = async (eventId: string) => {
        if (!user?.id) return;
        try {
            const response = await fetch(`${API_BASE}/api/events/${eventId}/register`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clerkId: user.id }),
            });

            if (response.ok) {
                dispatch({
                    type: 'UPDATE_EVENT_REGISTRATION',
                    payload: { eventId, isRegistered: false }
                });
            }
        } catch (error) {
            console.error('Error unregistering from event:', error);
        }
    };

    return (
        <CommunityContext.Provider
            value={{
                state,
                loginMentor,
                logoutMentor,
                fetchMentors,
                fetchChatRooms,
                fetchMessages,
                sendMessage,
                createMentorRoom,
                setCurrentRoom,
                fetchEvents,
                registerForEvent,
                unregisterFromEvent,
            }}
        >
            {children}
        </CommunityContext.Provider>
    );
};

export const useCommunity = () => {
    const context = useContext(CommunityContext);
    if (!context) {
        throw new Error('useCommunity must be used within a CommunityProvider');
    }
    return context;
};
