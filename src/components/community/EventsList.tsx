import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Users, Calendar } from 'lucide-react';
import { useCommunity, Event } from '@/contexts/CommunityContext';
import { format } from 'date-fns';

const EventsList: React.FC = () => {
    const { state, registerForEvent, unregisterFromEvent } = useCommunity();

    const handleToggleRegistration = async (event: Event) => {
        if (event.isRegistered) {
            await unregisterFromEvent(event.id);
        } else {
            await registerForEvent(event.id);
        }
    };

    // Use mock events if none from API
    const events: Event[] = state.events.length > 0 ? state.events : [
        {
            id: '1',
            title: 'Art Therapy Workshop',
            category: 'Art',
            host: 'Creative Wellness Team',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '2 hours',
            location: 'Online',
            participantCount: 8,
            maxParticipants: 15,
            description: 'Express yourself through colors and creative art in a supportive environment.',
            image: '🎨',
            isRegistered: false,
        },
        {
            id: '2',
            title: 'Music Therapy Session',
            category: 'Music',
            host: 'Sound Healing Collective',
            date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '1.5 hours',
            location: 'Online',
            participantCount: 12,
            maxParticipants: 20,
            description: 'Experience the healing power of music and sound in this group session.',
            image: '🎵',
            isRegistered: false,
        },
        {
            id: '3',
            title: 'Nature Photography Walk',
            category: 'Photography',
            host: 'Outdoor Wellness Group',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '3 hours',
            location: 'Lodhi Gardens, Delhi',
            participantCount: 5,
            maxParticipants: 12,
            description: 'Connect with nature and practice mindfulness through photography.',
            image: '📸',
            isRegistered: false,
        },
        {
            id: '4',
            title: 'Reading Circle: Mental Wellness',
            category: 'Reading',
            host: 'Book Club Wellness',
            date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '1 hour',
            location: 'Online',
            participantCount: 7,
            maxParticipants: 10,
            description: 'Discuss inspiring books about mental health and personal growth.',
            image: '📚',
            isRegistered: false,
        },
    ];

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            {events.map((event) => (
                <div
                    key={event.id}
                    className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl transition-shadow"
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="text-4xl">{event.image}</div>
                            <span className="px-3 py-1 bg-clay/20 text-primary-dark rounded-full text-sm font-medium">
                                {event.category}
                            </span>
                        </div>

                        <h3 className="font-bold text-gray-900 text-lg mb-2">{event.title}</h3>
                        <p className="text-gray-700 text-sm mb-4 leading-relaxed">{event.description}</p>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center space-x-3">
                                <Clock size={16} className="text-gray-500" />
                                <div className="text-sm">
                                    <span className="text-gray-600">
                                        {format(new Date(event.date), 'EEE, MMM d, h:mm a')}
                                    </span>
                                    <span className="text-gray-500 ml-2">({event.duration})</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <MapPin size={16} className="text-gray-500" />
                                <span className="text-sm text-gray-600">{event.location}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Users size={16} className="text-gray-500" />
                                <span className="text-sm text-gray-600">
                                    {event.participantCount}/{event.maxParticipants} participants
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="text-sm text-gray-600">
                                Hosted by <span className="font-medium text-gray-900">{event.host}</span>
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-sage h-2 rounded-full transition-all"
                                    style={{ width: `${(event.participantCount / event.maxParticipants) * 100}%` }}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => handleToggleRegistration(event)}
                            disabled={!event.isRegistered && event.participantCount >= event.maxParticipants}
                            className={`w-full py-3 rounded-xl font-medium transition-colors ${event.isRegistered
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-gradient-to-br from-primary-light to-primary-dark text-primary-foreground hover:opacity-90'
                                }`}
                        >
                            {event.isRegistered ? 'Cancel Registration' :
                                event.participantCount >= event.maxParticipants ? 'Event Full' : 'Sign Up'}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EventsList;
