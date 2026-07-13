import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Video, HeadphonesIcon, Search, Clock, Star, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";

const ResourceHub = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const categories = [
    { id: 'all', label: 'All Resources', count: 24 },
    { id: 'anxiety', label: 'Anxiety', count: 8 },
    { id: 'depression', label: 'Depression', count: 6 },
    { id: 'stress', label: 'Stress Management', count: 7 },
    { id: 'sleep', label: 'Sleep', count: 3 }
  ];

  const resources = [
    {
      id: 1,
      type: 'article',
      title: 'Understanding College Anxiety: A Complete Guide',
      description: 'Learn about the common causes of anxiety in college students and evidence-based strategies for managing symptoms.',
      category: 'anxiety',
      readTime: '8 min read',
      rating: 4.8,
      featured: true
    },
    {
      id: 2,
      type: 'video',
      title: 'Mindfulness Meditation for Beginners',
      description: 'A guided 10-minute meditation session to help reduce stress and improve focus.',
      category: 'stress',
      duration: '10 min',
      rating: 4.9,
      featured: false
    },
    {
      id: 3,
      type: 'audio',
      title: 'Sleep Stories: Peaceful Campus Nights',
      description: 'Calming audio stories designed to help college students fall asleep naturally.',
      category: 'sleep',
      duration: '15 min',
      rating: 4.7,
      featured: true
    },
    {
      id: 4,
      type: 'article',
      title: 'Building Resilience During Exam Season',
      description: 'Practical strategies for maintaining mental health during high-stress academic periods.',
      category: 'stress',
      readTime: '6 min read',
      rating: 4.6,
      featured: false
    },
    {
      id: 5,
      type: 'video',
      title: 'Cognitive Behavioral Techniques for Students',
      description: 'Learn CBT strategies specifically adapted for common college mental health challenges.',
      category: 'depression',
      duration: '18 min',
      rating: 4.9,
      featured: true
    },
    {
      id: 6,
      type: 'article',
      title: 'Social Anxiety in College: Making Connections',
      description: 'Tips and strategies for overcoming social anxiety and building meaningful relationships on campus.',
      category: 'anxiety',
      readTime: '5 min read',
      rating: 4.5,
      featured: false
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return HeadphonesIcon;
      default: return BookOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'therapeutic-blue';
      case 'audio': return 'therapeutic-purple';
      default: return 'therapeutic-green';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || resource.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen pt-20 pb-8 bg-gradient-calm">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">{t('resources.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('resources.subtitle')}</p>
        </div>

        {/* Search and Filters */}
        <Card className="mindwell-card p-6 mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('resources.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mindwell-input pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeFilter === category.id ? "default" : "outline"}
                  onClick={() => setActiveFilter(category.id)}
                  className="rounded-xl text-sm"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {category.label} ({category.count})
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Featured Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('resources.featured')}</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {filteredResources.filter(r => r.featured).map((resource, index) => {
              const Icon = getTypeIcon(resource.type);
              const typeColor = getTypeColor(resource.type);
              return (
                <Card 
                  key={resource.id} 
                  className={`mindwell-card p-6 cursor-pointer hover:shadow-therapeutic hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-${typeColor} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-${typeColor}/10`}>
                      <Icon className={`w-5 h-5 text-${typeColor}`} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning/10 text-warning">{t('resources.featuredBadge')}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{resource.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {resource.readTime || resource.duration}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 mr-1 text-warning" />
                        {resource.rating}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* All Resources */}
        <div>
          <h2 className="text-2xl font-bold mb-6">{t('resources.all')}</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {filteredResources.map((resource, index) => {
              const Icon = getTypeIcon(resource.type);
              const typeColor = getTypeColor(resource.type);
              return (
                <Card 
                  key={resource.id} 
                  className={`mindwell-card p-6 cursor-pointer hover:shadow-therapeutic hover:-translate-y-1 transition-all duration-300 animate-fade-in`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-${typeColor}/10 flex-shrink-0`}>
                      <Icon className={`w-5 h-5 text-${typeColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold line-clamp-2">{resource.title}</h3>
                        {resource.featured && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning/10 text-warning ml-2 flex-shrink-0">{t('resources.featuredBadge')}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{resource.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {resource.readTime || resource.duration}
                          </div>
                          <div className="flex items-center">
                            <Star className="w-3 h-3 mr-1 text-warning" />
                            {resource.rating}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10 rounded-lg">
                          {t('resources.ctaButton')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="mindwell-card p-8 mt-12 text-center animate-fade-in">
          <h3 className="text-xl font-semibold mb-2">{t('resources.ctaTitle')}</h3>
          <p className="text-muted-foreground mb-4">{t('resources.ctaText')}</p>
          <Button className="rounded-xl px-6">
            <BookOpen className="w-4 h-4 mr-2" />
            {t('resources.ctaButton')}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ResourceHub;