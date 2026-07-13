import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { useCommunity, ChatMessage, ChatRoom } from '@/contexts/CommunityContext';
import { useUser } from '@clerk/clerk-react';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionGroup {
    id: string;
    name: string;
    topic: string;
    description: string;
    participantCount: number;
    type: string;
}

const GroupDiscussion: React.FC = () => {
    const { state, sendMessage, fetchMessages, setCurrentRoom, fetchChatRooms } = useCommunity();
    const { user } = useUser();
    const [selectedGroup, setSelectedGroup] = useState<DiscussionGroup | null>(null);
    const [messageText, setMessageText] = useState('');
    const [groups, setGroups] = useState<DiscussionGroup[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch real groups from DB
    useEffect(() => {
        const loadGroups = async () => {
            setLoadingGroups(true);
            try {
                const rooms = await fetchChatRooms('group');
                const mapped: DiscussionGroup[] = rooms.map((r: Record<string, unknown> & { id: string; name?: string | null }) => ({
                    id: r.id,
                    name: r.name || 'Group',
                    topic: r.topic || 'General',
                    description: r.description || '',
                    participantCount: r.participants?.length ?? 0,
                    type: r.type,
                }));
                setGroups(mapped);
            } catch (e) {
                console.error('Failed to load groups:', e);
            } finally {
                setLoadingGroups(false);
            }
        };
        loadGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state.currentRoom?.messages]);

    const handleSelectGroup = async (group: DiscussionGroup) => {
        setSelectedGroup(group);
        // Set a room skeleton first so the UI shows immediately
        setCurrentRoom({
            id: group.id,
            type: 'group',
            name: group.name,
            topic: group.topic,
            messages: [],
        });
        // Then fetch real persisted messages
        await fetchMessages(group.id, {
            id: group.id,
            type: 'group',
            name: group.name,
            messages: [],
        });
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedGroup) return;
        await sendMessage(selectedGroup.id, messageText.trim());
        setMessageText('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleBack = () => {
        setSelectedGroup(null);
        setCurrentRoom(null);
    };

    // ── Chat View ────────────────────────────────────────────────────────────
    if (selectedGroup) {
        return (
            <div className="h-[600px] flex flex-col bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-white/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Button variant="ghost" size="sm" onClick={handleBack} className="p-2">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div>
                                <h3 className="font-semibold text-gray-900">{selectedGroup.name}</h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Users className="w-3 h-3" />
                                    <span>{selectedGroup.participantCount} members</span>
                                </div>
                            </div>
                        </div>
                        <Badge variant="secondary">{selectedGroup.topic}</Badge>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50/20 to-purple-50/20">
                    {(!state.currentRoom?.messages || state.currentRoom.messages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="text-4xl mb-4">💬</div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Start the discussion</h4>
                            <p className="text-gray-600 max-w-sm">Be the first to share something with the group!</p>
                        </div>
                    ) : (
                        state.currentRoom.messages.map((message: ChatMessage) => {
                            const isOwn = message.senderId === user?.id || message.role === (state.isMentorLoggedIn ? 'mentor' : 'user');
                            return (
                                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-xs lg:max-w-md">
                                        {!isOwn && (
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-lg">{message.senderAvatar || '👤'}</span>
                                                <span className="text-sm font-medium text-gray-700">{message.senderName || 'User'}</span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`px-4 py-3 rounded-2xl ${isOwn
                                            ? 'bg-blue-600 text-white rounded-br-md'
                                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'
                                            }`}>
                                            <p className="text-sm">{message.content}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
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
                            placeholder="Share with the group..."
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!messageText.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Messages are saved and visible to all group members.</p>
                </div>
            </div>
        );
    }

    // ── Group List View ──────────────────────────────────────────────────────
    if (loadingGroups) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">Loading groups...</p>
                </div>
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
                <p className="text-gray-600">Community groups will appear here once created.</p>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {groups.map((group) => (
                <div
                    key={group.id}
                    className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl transition-shadow"
                >
                    <div className="p-6">
                        <div className="mb-4">
                            <Badge variant="secondary" className="text-xs">{group.topic}</Badge>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">{group.name}</h3>
                        <p className="text-gray-700 text-sm mb-4 leading-relaxed">{group.description}</p>
                        <div className="flex items-center justify-between text-sm mb-6">
                            <div className="flex items-center space-x-1 text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{group.participantCount} members</span>
                            </div>
                        </div>
                        <Button
                            onClick={() => handleSelectGroup(group)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Enter Discussion
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GroupDiscussion;
