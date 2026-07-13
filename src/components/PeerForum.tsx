import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, MessageSquare, Heart, Plus, Clock, Eye, Sparkles } from "lucide-react";

const PeerForum = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);

  const categories = [
    { id: 'all', label: 'All Discussions', count: 156 },
    { id: 'anxiety', label: 'Anxiety Support', count: 45 },
    { id: 'academic', label: 'Academic Stress', count: 38 },
    { id: 'relationships', label: 'Relationships', count: 29 },
    { id: 'sleep', label: 'Sleep Issues', count: 22 },
    { id: 'general', label: 'General Support', count: 22 }
  ];

  const discussions = [
    {
      id: 1,
      title: "Feeling overwhelmed with midterms approaching",
      content: "Anyone else feeling completely stressed about midterms? I feel like I'm behind on everything and can't catch up...",
      author: "Alex_21",
      authorInitials: "A",
      category: 'academic',
      timeAgo: '2 hours ago',
      replies: 12,
      likes: 8,
      views: 45,
      isActive: true
    },
    {
      id: 2,
      title: "Tips for making friends as an introvert?",
      content: "I've been at college for a semester now and still struggling to make meaningful connections. Any advice from fellow introverts who've been through this?",
      author: "QuietStudent",
      authorInitials: "Q",
      category: 'relationships',
      timeAgo: '4 hours ago',
      replies: 18,
      likes: 15,
      views: 67,
      isActive: false
    },
    {
      id: 3,
      title: "Anxiety before presentations - how do you cope?",
      content: "I have a big presentation tomorrow and I'm already feeling sick to my stomach. The anxiety is keeping me awake. What helps you all get through this?",
      author: "Nervous_Presenter",
      authorInitials: "N",
      category: 'anxiety',
      timeAgo: '6 hours ago',
      replies: 24,
      likes: 19,
      views: 89,
      isActive: true
    },
    {
      id: 4,
      title: "Celebrating small wins in recovery",
      content: "Just wanted to share that I finally went to a study group today without having a panic attack. Small steps but feeling proud!",
      author: "GrowingStrong",
      authorInitials: "G",
      category: 'general',
      timeAgo: '1 day ago',
      replies: 31,
      likes: 47,
      views: 112,
      isActive: false
    },
    {
      id: 5,
      title: "Can't sleep because of racing thoughts",
      content: "It's 3 AM and my mind won't stop racing about all the assignments due this week. Anyone have techniques that actually work for shutting off the brain?",
      author: "NightOwl_Student",
      authorInitials: "N",
      category: 'sleep',
      timeAgo: '1 day ago',
      replies: 15,
      likes: 12,
      views: 58,
      isActive: true
    }
  ];

  const filteredDiscussions = selectedCategory === 'all' 
    ? discussions 
    : discussions.filter(d => d.category === selectedCategory);

  return (
    <div className="min-h-screen pt-20 pb-8 bg-gradient-calm">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Peer Support Forum</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow students who understand what you're going through. 
            Share experiences, offer support, and find community in a safe, moderated space.
          </p>
        </div>

        {/* Community Guidelines Notice */}
        <Card className="mindwell-card p-4 mb-6 border-l-4 border-l-primary animate-fade-in">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Community Guidelines</p>
              <p className="text-xs text-muted-foreground">
                This is a supportive space. Be kind, respectful, and remember that everyone is on their own journey.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card className="mindwell-card p-6 animate-fade-in">
              <h3 className="font-semibold mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="w-full justify-between text-left h-auto p-3 rounded-xl"
                  >
                    <span className="text-sm">{category.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Button 
                  onClick={() => setShowNewPost(!showNewPost)}
                  className="w-full rounded-xl"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Discussion
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* New Post Form */}
            {showNewPost && (
              <Card className="mindwell-card p-6 animate-fade-in">
                <h3 className="text-lg font-semibold mb-4">Start a New Discussion</h3>
                <div className="space-y-4">
                  <Input 
                    placeholder="What would you like to discuss?"
                    className="mindwell-input"
                  />
                  <Textarea 
                    placeholder="Share your thoughts, experiences, or questions. Remember, this is a safe space for support and understanding."
                    className="mindwell-input min-h-[120px] resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {categories.slice(1).map((cat) => (
                        <Badge key={cat.id} variant="outline" className="cursor-pointer hover:bg-accent">
                          {cat.label}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowNewPost(false)}>Cancel</Button>
                      <Button>Post Discussion</Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Discussions List */}
            <div className="space-y-4">
              {filteredDiscussions.map((discussion, index) => (
                <Card 
                  key={discussion.id} 
                  className={`mindwell-card p-6 cursor-pointer hover:shadow-therapeutic transition-all duration-300 animate-fade-in ${
                    discussion.isActive ? 'border-l-4 border-l-success' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {discussion.authorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{discussion.author}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{discussion.timeAgo}</span>
                          {discussion.isActive && (
                            <Badge variant="outline" className="text-xs px-2 py-0 bg-success/10 text-success border-success/20">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {categories.find(c => c.id === discussion.category)?.label}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
                    {discussion.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {discussion.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{discussion.replies}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{discussion.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{discussion.views}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-lg">
                      Join Discussion
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Call to Action */}
            <Card className="mindwell-card p-6 text-center animate-fade-in">
              <h3 className="text-lg font-semibold mb-2">Need Professional Support?</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                While peer support is valuable, remember that our AI companion and campus resources 
                are available for additional professional guidance.
              </p>
              <Button variant="outline" className="rounded-xl">
                Talk to AI Companion
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerForum;