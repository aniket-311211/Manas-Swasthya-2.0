import React, { useState, useEffect, useCallback } from 'react';
import { Search, Play, Download, BookOpen, Music, Film, Activity, Palette, MoreHorizontal, ArrowLeft, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlaceholdersAndVanishInputDemo } from '@/components/ui/PlaceholdersAndVanishInputDemo';
import { aiAdvisoryService, ResourceRecommendation, AssessmentData } from '@/lib/aiAdvisoryService';

interface Resource {
  id: number;
  code: string;
  title: string;
  type: string;
  pages?: number;
  duration?: string;
  author: string;
  category: string;
  description: string;
  tags: string[];
  thumbnail: string;
  audioSrc?: string;
  videoSrc?: string;
  pdfSrc?: string;
  hasAudio?: boolean;
  hasVideo?: boolean;
  hasPdf?: boolean;
}

const categories = [
  { id: 'all', name: 'All', icon: MoreHorizontal },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'books', name: 'Books', icon: BookOpen },
  { id: 'movies', name: 'Movies', icon: Film },
  { id: 'activities', name: 'Activities', icon: Activity },
  { id: 'hobbies', name: 'Hobbies', icon: Palette },
];

const resources = [
  // Music
  { id: 1, code: 'MUS-101', title: 'Relaxing Ocean Waves', type: 'music', duration: '10:00', author: 'Nature Sounds', category: 'music', description: 'Gentle ocean waves for deep relaxation and sleep', tags: ['relaxation', 'sleep', 'nature'], thumbnail: '🌊' },
  { id: 2, code: 'MUS-102', title: 'Mindful Meditation Music', type: 'music', duration: '15:00', author: 'Zen Masters', category: 'music', description: 'Tibetan singing bowls and soft ambient sounds', tags: ['meditation', 'mindfulness', 'zen'], thumbnail: '🎵', audioSrc: 'bird.mp3', hasAudio: true },
  { id: 3, code: 'MUS-103', title: 'Forest Rain Sounds', type: 'music', duration: '20:00', author: 'Natural Harmony', category: 'music', description: 'Peaceful rain falling on leaves in a quiet forest', tags: ['rain', 'forest', 'peace'], thumbnail: '🌧️' },
  
  // Books
  { id: 4, code: 'BK-201', title: 'Mindfulness for Beginners', type: 'book', pages: 180, author: 'Dr. Sarah Chen', category: 'books', description: 'A practical guide to starting your mindfulness journey', tags: ['mindfulness', 'beginners', 'practice'], thumbnail: '📚', pdfSrc: 'mindfulness-beginners.pdf', hasPdf: true },
  { id: 5, code: 'BK-202', title: 'Overcoming Anxiety', type: 'book', pages: 245, author: 'Dr. Michael Roberts', category: 'books', description: 'Evidence-based strategies for managing anxiety', tags: ['anxiety', 'coping', 'self-help'], thumbnail: '📖' },
  { id: 6, code: 'BK-203', title: 'The Science of Happiness', type: 'book', pages: 320, author: 'Prof. Lisa Johnson', category: 'books', description: 'Understanding the psychology behind well-being', tags: ['happiness', 'psychology', 'science'], thumbnail: '📘' },
  
  // Movies
  { id: 7, code: 'MOV-301', title: 'Inside Out Emotional', type: 'movie', duration: '95 min', author: 'Pixar Animation', category: 'movies', description: 'A beautiful exploration of emotions and mental health', tags: ['emotions', 'family', 'psychology'], thumbnail: '🎬', videoSrc: 'Inside Out - Emotional Intelligence.mp4', hasVideo: true },
  { id: 8, code: 'MOV-302', title: 'A Beautiful Mind', type: 'movie', duration: '135 min', author: 'Ron Howard', category: 'movies', description: 'Inspiring story about overcoming mental health challenges', tags: ['inspiration', 'mental health', 'biography'], thumbnail: '🎭' },
  { id: 9, code: 'MOV-303', title: 'Good Will Hunting', type: 'movie', duration: '126 min', author: 'Gus Van Sant', category: 'movies', description: 'A touching story about therapy and self-discovery', tags: ['therapy', 'growth', 'relationships'], thumbnail: '🎪', videoSrc: 'Thought Bubbles! For Anxiety & Worry..mp4', hasVideo: true },
  
  // Activities
  { id: 10, code: 'ACT-401', title: 'Breathing Exercise Guide', type: 'activity', duration: '5 min', author: 'Wellness Team', category: 'activities', description: '4-7-8 breathing technique for instant calm', tags: ['breathing', 'stress relief', 'quick'], thumbnail: '🫁' },
  { id: 11, code: 'ACT-402', title: 'Progressive Muscle Relaxation', type: 'activity', duration: '15 min', author: 'Relaxation Experts', category: 'activities', description: 'Systematic tension and release for deep relaxation', tags: ['relaxation', 'muscle tension', 'guided'], thumbnail: '💆‍♂️' },
  { id: 12, code: 'ACT-403', title: 'Gratitude Journaling', type: 'activity', duration: '10 min', author: 'Positive Psychology Team', category: 'activities', description: 'Daily practice to cultivate appreciation', tags: ['gratitude', 'journaling', 'positive'], thumbnail: '✍️' },
  
  // Hobbies
  { id: 13, code: 'HOB-501', title: 'Watercolor Painting Basics', type: 'hobby', duration: '30 min', author: 'Art Therapy Institute', category: 'hobbies', description: 'Therapeutic painting techniques for beginners', tags: ['art', 'creativity', 'therapy'], thumbnail: '🎨' },
  { id: 14, code: 'HOB-502', title: 'Indoor Gardening Guide', type: 'hobby', duration: '45 min', author: 'Green Therapy', category: 'hobbies', description: 'Growing plants for mental wellness', tags: ['gardening', 'nature', 'care'], thumbnail: '🪴' },
  { id: 15, code: 'HOB-503', title: 'Beginner Knitting', type: 'hobby', duration: '60 min', author: 'Craft Wellness', category: 'hobbies', description: 'Meditative knitting patterns and techniques', tags: ['knitting', 'meditation', 'crafts'], thumbnail: '🧶' },
];

const getUserAssessmentData = (): AssessmentData | null => {
  try {
    const savedData = localStorage.getItem('lastAssessmentData');
    return savedData ? JSON.parse(savedData) : null;
  } catch {
    return null;
  }
};

const Resources: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<ResourceRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const handleDownload = (resource: Resource) => {
    if (resource.audioSrc) {
      const link = document.createElement('a');
      link.href = `/animation/${resource.audioSrc}`;
      link.download = `${resource.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (resource.videoSrc) {
      const link = document.createElement('a');
      link.href = `/animation/${resource.videoSrc}`;
      link.download = `${resource.title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (resource.pdfSrc) {
      const link = document.createElement('a');
      link.href = `/animation/${resource.pdfSrc}`;
      link.download = `${resource.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Get user assessment data from localStorage
  // Moved to module scope to avoid re-creation

  // Generate AI recommendations based on user assessment
  const generateAIRecommendations = useCallback(async () => {
    const assessmentData = getUserAssessmentData();
    if (!assessmentData) {
      setAiRecommendations([]);
      return;
    }

    setLoadingRecommendations(true);
    try {
      const recommendations = await aiAdvisoryService.generateResourceRecommendations(
        assessmentData,
        resources
      );
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);


  useEffect(() => {
    // Auto-generate recommendations if user has assessment data
    const assessmentData = getUserAssessmentData();
    if (assessmentData) {
      generateAIRecommendations();
    }
  }, [generateAIRecommendations]);

  const filteredResources = resources.filter(resource => {
    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      resource.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (selectedResource) {
    return (
      <div className="min-h-screen pt-24 pb-8 bg-gradient-calm">
        <div className="container mx-auto px-6 max-w-6xl">
          <button
            onClick={() => setSelectedResource(null)}
            className="flex items-center space-x-2 mb-6 text-teal-600 hover:text-teal-700"
          >
            <ArrowLeft size={20} />
            <span>{t('resources.backToResources')}</span>
          </button>

          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:space-x-8">
                <div className="lg:w-2/3">
                  <div className="flex items-start space-x-6 mb-8">
                    <div className="text-8xl">{selectedResource.thumbnail}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                          {selectedResource.code}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {selectedResource.category}
                        </span>
                      </div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedResource.title}</h1>
                      <p className="text-lg text-gray-600 mb-4">by {selectedResource.author}</p>
                      <p className="text-gray-700 leading-relaxed mb-6">{selectedResource.description}</p>
                      
                      <div className="flex items-center space-x-6 text-gray-600">
                        <div className="flex items-center space-x-2">
                          {selectedResource.type === 'music' || selectedResource.type === 'movie' ? (
                            <>
                              <Play size={16} />
                              <span>{selectedResource.duration}</span>
                            </>
                          ) : selectedResource.type === 'book' ? (
                            <>
                              <BookOpen size={16} />
                              <span>{selectedResource.pages} pages</span>
                            </>
                          ) : (
                            <>
                              <Activity size={16} />
                              <span>{selectedResource.duration}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedResource.tags.map((tag: string) => (
                        <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Media Player */}
                  <div className="bg-gray-900 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">
                        {selectedResource.type === 'music' ? t('resources.nowPlaying') : 
                         selectedResource.type === 'movie' ? t('resources.nowWatching') : 
                         selectedResource.hasPdf ? t('resources.pdfViewer') :
                         t('resources.nowReading')}
                      </h4>
                      <div className="text-sm text-gray-300">
                        {selectedResource.type === 'book' ? t('resources.page', { page: 1 }) : '0:00'}
                      </div>
                    </div>
                    
                    {selectedResource.hasAudio && selectedResource.audioSrc ? (
                      <div className="mb-4">
                        <audio
                          className="w-full"
                          controls
                          autoPlay={playingAudio === selectedResource.id}
                          onEnded={() => setPlayingAudio(null)}
                        >
                          <source src={`/animation/${selectedResource.audioSrc}`} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ) : selectedResource.hasVideo && selectedResource.videoSrc ? (
                      <div className="mb-4">
                        <video
                          className="w-full h-64 object-cover rounded-lg"
                          controls
                          autoPlay={playingVideo === selectedResource.id}
                          onEnded={() => setPlayingVideo(null)}
                        >
                          <source src={`/animation/${selectedResource.videoSrc}`} type="video/mp4" />
                          Your browser does not support the video element.
                        </video>
                      </div>
                    ) : selectedResource.hasPdf && selectedResource.pdfSrc ? (
                      <div className="mb-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-gray-900 font-medium">{t('resources.readPdf')}</h5>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => window.open(`/animation/${selectedResource.pdfSrc}`, '_blank')}
                                className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 transition-colors"
                              >
                                {t('resources.openInNewTab')}
                              </button>
                              <button
                                onClick={() => handleDownload(selectedResource)}
                                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                              >
                                {t('resources.downloadPdf')}
                              </button>
                            </div>
                          </div>
                          <div className="border border-gray-300 rounded-lg overflow-hidden">
                            <iframe
                              src={`/animation/${selectedResource.pdfSrc}#toolbar=1&navpanes=1&scrollbar=1`}
                              className="w-full h-96"
                              title={selectedResource.title}
                              onError={() => {
                                // Fallback for browsers that don't support PDF viewing
                                const iframe = document.querySelector('iframe[title="' + selectedResource.title + '"]') as HTMLIFrameElement;
                                if (iframe) {
                                  iframe.style.display = 'none';
                                  const fallback = document.createElement('div');
                                  fallback.className = 'p-8 text-center text-gray-600';
                                  fallback.innerHTML = `
                                    <div class="text-4xl mb-4">📄</div>
                                    <p class="mb-4">${t('resources.pdfNotSupported')}</p>
                                    <button onclick="window.open('/animation/${selectedResource.pdfSrc}', '_blank')" class="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors">
                                      ${t('resources.openInNewTab')}
                                    </button>
                                  `;
                                  iframe.parentNode?.insertBefore(fallback, iframe);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gray-700 h-2 rounded-full mb-4">
                          <div className="bg-teal-400 h-2 rounded-full w-0"></div>
                        </div>
                        
                        <div className="flex items-center justify-center space-x-6">
                          <button className="p-3 rounded-full hover:bg-gray-700 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 6h2v12H6zm10 0h2v12h-2z"/>
                            </svg>
                          </button>
                          <button 
                            className="p-4 bg-teal-600 rounded-full hover:bg-teal-700 transition-colors"
                            onClick={() => setPlayingAudio(playingAudio === selectedResource.id ? null : selectedResource.id)}
                          >
                            <Play size={20} fill="white" />
                          </button>
                          <button className="p-3 rounded-full hover:bg-gray-700 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="lg:w-1/3 mt-8 lg:mt-0">
                  <div className="bg-gray-50/80 rounded-2xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">{t('resources.resourceActions')}</h3>
                    
                    <div className="space-y-3">
                      {selectedResource.hasPdf ? (
                        <>
                          <button 
                            className="w-full bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center justify-center space-x-2"
                            onClick={() => window.open(`/animation/${selectedResource.pdfSrc}`, '_blank')}
                          >
                            <BookOpen size={18} />
                            <span>{t('resources.readPdf')}</span>
                          </button>
                          
                          <button 
                            className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
                            onClick={() => handleDownload(selectedResource)}
                          >
                            <Download size={18} />
                            <span>{t('resources.downloadPdf')}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="w-full bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center justify-center space-x-2"
                            onClick={() => {
                              if (selectedResource.hasAudio) {
                                setPlayingAudio(playingAudio === selectedResource.id ? null : selectedResource.id);
                              } else if (selectedResource.hasVideo) {
                                setPlayingVideo(playingVideo === selectedResource.id ? null : selectedResource.id);
                              }
                            }}
                          >
                            <Play size={18} />
                            <span>
                              {selectedResource.hasAudio && playingAudio === selectedResource.id ? 'Stop' :
                               selectedResource.hasVideo && playingVideo === selectedResource.id ? 'Stop' :
                               t('resources.playView')}
                            </span>
                          </button>
                          
                          <button 
                            className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
                            onClick={() => handleDownload(selectedResource)}
                          >
                            <Download size={18} />
                            <span>{t('resources.download')}</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">{t('resources.recommendedDuration')}</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {selectedResource.type === 'music' || selectedResource.type === 'activity' 
                          ? t('resources.listenPractice', { duration: selectedResource.duration })
                          : selectedResource.type === 'book'
                          ? t('resources.readPages')
                          : t('resources.watchInspiration')}
                      </p>
                      
                      <h4 className="font-medium text-gray-900 mb-3">{t('resources.relatedResources')}</h4>
                      <div className="space-y-2">
                        {resources.filter(r => r.category === selectedResource.category && r.id !== selectedResource.id).slice(0, 2).map(resource => (
                          <button
                            key={resource.id}
                            onClick={() => setSelectedResource(resource)}
                            className="w-full text-left p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{resource.thumbnail}</span>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{resource.title}</p>
                                <p className="text-xs text-gray-600">{resource.code}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-8 bg-gradient-calm">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('resources.backToDashboard')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('resources.title')}</h1>
          
          {/* Search Bar */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/50 mb-6">
            <div className="relative">
              <PlaceholdersAndVanishInputDemo 
                onInputChange={(value) => setSearchQuery(value)}
                onSubmit={(value) => {
                  setSearchQuery(value);
                  // Optional: Add additional search logic here
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholders={[
                  "Search for mental health resources...",
                  "Find books, videos, or activities...",
                  "Explore anxiety management resources...",
                  "Discover stress relief techniques...",
                  "Search for sleep improvement resources...",
                  "Find depression support materials..."
                ]}
              />
            </div>
          </div>

          {/* AI Recommendation Banner */}
          {aiRecommendations.length > 0 && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 mb-6 border border-purple-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-600 rounded-xl">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI-Powered Recommendations</h3>
                    <p className="text-sm text-gray-600">Based on your recent assessment</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIRecommendations(!showAIRecommendations)}
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  {showAIRecommendations ? 'Hide' : 'View All'}
                </button>
              </div>
              
              {showAIRecommendations && (
                <div className="space-y-3">
                  {aiRecommendations.slice(0, 3).map((rec) => {
                    const resource = resources.find(r => r.id === rec.id);
                    if (!resource) return null;
                    
                    return (
                      <div key={rec.id} className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{resource.thumbnail}</span>
                            <div>
                              <h4 className="font-medium text-gray-900">{resource.title}</h4>
                              <p className="text-sm text-gray-600">{rec.reason}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {rec.priority} priority
                                </span>
                                <span className="text-xs text-gray-500">{rec.confidence}% match</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedResource(resource)}
                            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* AI Recommendations Button */}
          {getUserAssessmentData() && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-3">
                <button
                  onClick={generateAIRecommendations}
                  disabled={loadingRecommendations}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  <Target size={18} />
                  <span className="font-medium">
                    {loadingRecommendations ? 'Generating...' : 'Get AI Recommendations'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                    activeCategory === category.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-white/70 text-gray-700 hover:bg-white'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:scale-105 transition-transform cursor-pointer"
              onClick={() => setSelectedResource(resource)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{resource.thumbnail}</div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                      {resource.code}
                    </span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{resource.title}</h3>
                <p className="text-gray-600 text-sm mb-2">by {resource.author}</p>
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">{resource.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    {resource.type === 'music' || resource.type === 'movie' ? (
                      <>
                        <Play size={14} />
                        <span className="text-sm">{resource.duration}</span>
                      </>
                    ) : resource.type === 'book' ? (
                      <>
                        <BookOpen size={14} />
                        <span className="text-sm">{resource.pages} pages</span>
                      </>
                    ) : (
                      <>
                        <Activity size={14} />
                        <span className="text-sm">{resource.duration}</span>
                      </>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs capitalize">
                    {resource.category}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Media Player for Audio/Video Resources */}
                {(resource.hasAudio || resource.hasVideo) && (playingAudio === resource.id || playingVideo === resource.id) && (
                  <div className="mb-4 bg-gray-900 rounded-lg p-3">
                    {resource.hasAudio && playingAudio === resource.id ? (
                      <audio
                        className="w-full"
                        controls
                        autoPlay
                        onEnded={() => setPlayingAudio(null)}
                      >
                        <source src={`/animation/${resource.audioSrc}`} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    ) : resource.hasVideo && playingVideo === resource.id ? (
                      <video
                        className="w-full h-32 object-cover rounded"
                        controls
                        autoPlay
                        onEnded={() => setPlayingVideo(null)}
                      >
                        <source src={`/animation/${resource.videoSrc}`} type="video/mp4" />
                        Your browser does not support the video element.
                      </video>
                    ) : null}
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (resource.hasAudio || resource.hasVideo) {
                        if (resource.hasAudio) {
                          setPlayingAudio(playingAudio === resource.id ? null : resource.id);
                        } else if (resource.hasVideo) {
                          setPlayingVideo(playingVideo === resource.id ? null : resource.id);
                        }
                      } else if (resource.hasPdf) {
                        window.open(`/animation/${resource.pdfSrc}`, '_blank');
                      } else {
                        setSelectedResource(resource);
                      }
                    }}
                    className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    {resource.hasPdf ? <BookOpen size={14} /> : <Play size={14} />}
                    <span>
                      {resource.hasAudio && playingAudio === resource.id ? 'Pause' :
                       resource.hasVideo && playingVideo === resource.id ? 'Pause' :
                       resource.hasPdf ? t('resources.readPdf') :
                       t('resources.view')}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(resource);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <Download size={14} />
                    <span>{resource.hasPdf ? t('resources.downloadPdf') : t('resources.download')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('resources.noResourcesFound')}</h3>
            <p className="text-gray-600">{t('resources.noResourcesMessage')}</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Resources;