import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import {
  ArrowLeft,
  MessageCircle,
  Calendar,
  Users,
  UserCheck,
  LogOut,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommunityProvider, useCommunity, Mentor } from '@/contexts/CommunityContext';
import MentorLogin from '@/components/community/MentorLogin';
import MentorChat from '@/components/community/MentorChat';
import GroupDiscussion from '@/components/community/GroupDiscussion';
import EventsList from '@/components/community/EventsList';

type TabType = 'mentor' | 'discussion' | 'events';

const CommunityContent: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { state, fetchMentors, fetchEvents, logoutMentor } = useCommunity();
  const [activeTab, setActiveTab] = useState<TabType>('mentor');
  const [showMentorLogin, setShowMentorLogin] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    fetchMentors();
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mock mentor for display (will be replaced by API data)
  const displayMentor: Mentor = state.mentors[0] || {
    id: 'mentor-1',
    name: 'Arjun Patel',
    avatar: '👨‍🎓',
    bio: 'Final year psychology student with training in peer counseling. Here to listen and support.',
    specialization: 'Anxiety & Stress',
    badge: 'Certified Peer Counselor',
    status: 'online',
    totalSessions: 45,
    rating: 4.8,
  };

  // If showing mentor login
  if (showMentorLogin) {
    return (
      <div className="min-h-full pt-6 pb-12 bg-gradient-calm">
        <div className="container mx-auto px-6 max-w-4xl py-6">
          <MentorLogin
            onBack={() => setShowMentorLogin(false)}
            onSuccess={() => setShowMentorLogin(false)}
          />
        </div>
      </div>
    );
  }

  // If in chat with mentor
  if (selectedMentor) {
    return (
      <div className="min-h-full pt-6 pb-12 bg-gradient-calm">
        <div className="container mx-auto px-6 max-w-4xl py-6 pb-24 lg:pb-6">
          <div className="mb-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <div className="h-[600px]">
            <MentorChat
              mentor={selectedMentor}
              onBack={() => setSelectedMentor(null)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pt-6 pb-12 bg-gradient-calm">
      <div className="container mx-auto px-6 max-w-6xl py-6 pb-24 lg:pb-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">{t('community.title')}</h1>

            {/* Mentor Status Badge */}
            {state.isMentorLoggedIn ? (
              <div className="flex items-center space-x-3">
                <Badge className="bg-teal-100 text-teal-700">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Mentor: {state.currentMentor?.name}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logoutMentor}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowMentorLogin(true)}
                className="text-teal-600 border-teal-600 hover:bg-teal-50"
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Mentor Login
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('mentor')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'mentor'
                ? 'bg-teal-600 text-white'
                : 'bg-white/70 text-gray-700 hover:bg-white'
              }`}
          >
            <div className="flex items-center space-x-2">
              <MessageCircle size={18} />
              <span>Mentor Chat</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'discussion'
                ? 'bg-blue-600 text-white'
                : 'bg-white/70 text-gray-700 hover:bg-white'
              }`}
          >
            <div className="flex items-center space-x-2">
              <Users size={18} />
              <span>Group Discussion</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'events'
                ? 'bg-orange-500 text-white'
                : 'bg-white/70 text-gray-700 hover:bg-white'
              }`}
          >
            <div className="flex items-center space-x-2">
              <Calendar size={18} />
              <span>Events</span>
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'mentor' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Mentor Cards */}
            <div className="lg:col-span-1 space-y-4">
              {(state.mentors.length > 0 ? state.mentors : [displayMentor]).map((mentor) => (
                <div key={mentor.id} className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{mentor.avatar}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-bold text-gray-900">{mentor.name}</h3>
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${mentor.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-teal-600">
                        <UserCheck size={13} /> {mentor.badge}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-700">{mentor.bio}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                    <span>{mentor.totalSessions} sessions · ★ {mentor.rating}</span>
                    <span>{mentor.specialization}</span>
                  </div>
                  <Button
                    onClick={() => setSelectedMentor(mentor)}
                    className="mt-4 w-full bg-teal-600 text-white hover:bg-teal-700"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Start Chat
                  </Button>
                </div>
              ))}
            </div>

            {/* Chat Preview / Info */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Connect with a Mentor
                </h3>
                <p className="text-gray-600 max-w-md mb-6">
                  {state.isMentorLoggedIn
                    ? "You're logged in as a mentor. Students can reach out to you for guidance and support."
                    : "Our trained peer counselors are here to listen and support you. Start a private, confidential conversation."}
                </p>

                <div className="grid grid-cols-3 gap-4 max-w-md w-full mb-6">
                  <div className="bg-teal-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-teal-600">24/7</p>
                    <p className="text-xs text-gray-600">Available</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">100%</p>
                    <p className="text-xs text-gray-600">Confidential</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">Free</p>
                    <p className="text-xs text-gray-600">Always</p>
                  </div>
                </div>

                <Button
                  onClick={() => setSelectedMentor(displayMentor)}
                  size="lg"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Start Chatting
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discussion' && <GroupDiscussion />}

        {activeTab === 'events' && <EventsList />}
      </div>
    </div>
  );
};

// Main wrapper with provider
const Community: React.FC = () => {
  return (
    <CommunityProvider>
      <CommunityContent />
    </CommunityProvider>
  );
};

export default Community;
