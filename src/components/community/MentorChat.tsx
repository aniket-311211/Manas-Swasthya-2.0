import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Circle, Video, Phone } from 'lucide-react';
import { useCommunity, ChatMessage, Mentor } from '@/contexts/CommunityContext';
import { useUser } from '@clerk/clerk-react';
import { format, formatDistanceToNow } from 'date-fns';

interface MentorChatProps {
    mentor: Mentor;
    onBack: () => void;
}

const MentorChat: React.FC<MentorChatProps> = ({ mentor, onBack }) => {
    const { state, sendMessage, createMentorRoom, fetchMessages, setCurrentRoom, fetchChatRooms } = useCommunity();
    const { user } = useUser();
    const [messageText, setMessageText] = useState('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get or create chat room
    useEffect(() => {
        const initRoom = async () => {
            setIsLoading(true);

            try {
                // Fetch all mentor chat rooms - this now returns the rooms directly
                const rooms = await fetchChatRooms('mentor');
                console.log('Fetched rooms:', rooms);

                // Check if room already exists for this mentor-student pair
                const existingRoom = rooms.find(
                    room => room.type === 'mentor' && room.mentorId === mentor.id
                );

                if (existingRoom) {
                    console.log('Found existing room:', existingRoom.id);
                    setRoomId(existingRoom.id);
                    // Fetch messages for this room
                    await fetchMessages(existingRoom.id, existingRoom);
                } else {
                    console.log('Creating new mentor room...');
                    // Create new room - createMentorRoom now sets the current room
                    const newRoomId = await createMentorRoom(mentor.id);
                    if (newRoomId) {
                        console.log('Created new room:', newRoomId);
                        setRoomId(newRoomId);
                    }
                }
            } catch (error) {
                console.error('Error initializing room:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initRoom();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mentor.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state.currentRoom?.messages]);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !roomId) return;

        await sendMessage(roomId, messageText.trim());
        setMessageText('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const renderMessage = (message: ChatMessage) => {
        const isOwnMessage = message.role === (state.isMentorLoggedIn ? 'mentor' : 'user');
        const isSystemMessage = message.role === 'system';

        if (isSystemMessage) {
            return (
                <div key={message.id} className="flex justify-center my-4">
                    <div className="bg-blue-50 text-blue-700 text-xs px-4 py-2 rounded-full border border-blue-200">
                        {message.content}
                    </div>
                </div>
            );
        }

        return (
            <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
            >
                <div className={`max-w-xs lg:max-w-md`}>
                    {!isOwnMessage && (
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{message.senderAvatar}</span>
                            <span className="text-sm font-medium text-gray-700">{message.senderName}</span>
                            <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                        </div>
                    )}
                    <div
                        className={`px-4 py-3 rounded-2xl ${isOwnMessage
                            ? 'bg-teal-600 text-white rounded-br-md'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'
                            }`}
                    >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {isOwnMessage && (
                            <div className="text-right mt-1">
                                <span className="text-xs text-teal-100">
                                    {format(new Date(message.timestamp), 'HH:mm')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-white/70 backdrop-blur-lg rounded-2xl">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-white/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <span className="text-2xl">{mentor.avatar || '👨‍🎓'}</span>
                                <Circle
                                    className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full ${mentor.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                                        }`}
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{mentor.name}</h3>
                                <span className="text-sm text-gray-600">
                                    {mentor.status === 'online' ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-blue-600">
                            <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-green-600">
                            <Phone className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gradient-to-b from-teal-50/20 to-blue-50/20">
                {(!state.currentRoom?.messages || state.currentRoom.messages.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-4xl mb-4">👋</div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                            Start chatting with {mentor.name}
                        </h4>
                        <p className="text-gray-600 max-w-sm">
                            {mentor.bio || 'Your mentor is here to help. Send a message to start the conversation.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {state.currentRoom.messages.map(renderMessage)}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white/50">
                <div className="flex items-center space-x-3">
                    <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Send a message to ${mentor.name}...`}
                        className="flex-1 border-gray-200"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="bg-teal-600 hover:bg-teal-700 px-4"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Messages are saved to your account and visible when you log in.
                </p>
            </div>
        </div>
    );
};

export default MentorChat;
