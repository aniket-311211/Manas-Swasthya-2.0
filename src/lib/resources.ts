// ponytail: `type`, not `interface` — interfaces get no implicit index signature,
// so Resource[] would not satisfy aiAdvisoryService's BaseResource[].
export type Resource = {
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

/** Shared catalogue. Consumed by the Resources page and the dashboard resource card. */
export const RESOURCES: Resource[] = [
  // Music
  { id: 1, code: 'MUS-101', title: 'Relaxing Ocean Waves', type: 'music', duration: '10:00', author: 'Nature Sounds', category: 'music', description: 'Gentle ocean waves for deep relaxation and sleep', tags: ['relaxation', 'sleep', 'nature'], thumbnail: '🌊', audioSrc: 'ocean-waves.mp3', hasAudio: true },
  { id: 2, code: 'MUS-102', title: 'Mindful Meditation Music', type: 'music', duration: '15:00', author: 'Zen Masters', category: 'music', description: 'Tibetan singing bowls and soft ambient sounds', tags: ['meditation', 'mindfulness', 'zen'], thumbnail: '🎵', audioSrc: 'bird.mp3', hasAudio: true },
  { id: 3, code: 'MUS-103', title: 'Forest Rain Sounds', type: 'music', duration: '20:00', author: 'Natural Harmony', category: 'music', description: 'Peaceful rain falling on leaves in a quiet forest', tags: ['rain', 'forest', 'peace'], thumbnail: '🌧️', audioSrc: 'forest-rain.mp3', hasAudio: true },
  
  // Books
  { id: 4, code: 'BK-201', title: 'Mindfulness for Beginners', type: 'book', pages: 180, author: 'Dr. Sarah Chen', category: 'books', description: 'A practical guide to starting your mindfulness journey', tags: ['mindfulness', 'beginners', 'practice'], thumbnail: '📚', pdfSrc: 'mindfulness-beginners.pdf', hasPdf: true },
  { id: 5, code: 'BK-202', title: 'Overcoming Anxiety', type: 'book', pages: 245, author: 'Dr. Michael Roberts', category: 'books', description: 'Evidence-based strategies for managing anxiety', tags: ['anxiety', 'coping', 'self-help'], thumbnail: '📖' },
  { id: 6, code: 'BK-203', title: 'The Science of Happiness', type: 'book', pages: 320, author: 'Prof. Lisa Johnson', category: 'books', description: 'Understanding the psychology behind well-being', tags: ['happiness', 'psychology', 'science'], thumbnail: '📘' },
  
  // Movies
  { id: 7, code: 'MOV-301', title: 'Inside Out Emotional', type: 'movie', duration: '95 min', author: 'Pixar Animation', category: 'movies', description: 'A beautiful exploration of emotions and mental health', tags: ['emotions', 'family', 'psychology'], thumbnail: '🎬', videoSrc: 'Inside Out - Emotional Intelligence.mp4', hasVideo: true },
  { id: 8, code: 'MOV-302', title: 'A Beautiful Mind', type: 'movie', duration: '135 min', author: 'Ron Howard', category: 'movies', description: 'Inspiring story about overcoming mental health challenges', tags: ['inspiration', 'mental health', 'biography'], thumbnail: '🎭', videoSrc: 'a-beautiful-mind.mp4', hasVideo: true },
  // Was titled "Good Will Hunting", 126 min, by Gus Van Sant — while playing a
  // short anxiety animation. The metadata now describes the file that is
  // actually there.
  { id: 9, code: 'MOV-303', title: 'Thought Bubbles: Anxiety and Worry', type: 'movie', duration: '4 min', author: 'Manas Swasthya', category: 'movies', description: 'A short animation on noticing anxious thoughts without being carried off by them', tags: ['anxiety', 'worry', 'animation'], thumbnail: '💭', videoSrc: 'Thought Bubbles! For Anxiety & Worry..mp4', hasVideo: true },
  
  // Activities
  { id: 10, code: 'ACT-401', title: 'Breathing Exercise Guide', type: 'activity', duration: '5 min', author: 'Wellness Team', category: 'activities', description: '4-7-8 breathing technique for instant calm', tags: ['breathing', 'stress relief', 'quick'], thumbnail: '🫁' },
  { id: 11, code: 'ACT-402', title: 'Progressive Muscle Relaxation', type: 'activity', duration: '15 min', author: 'Relaxation Experts', category: 'activities', description: 'Systematic tension and release for deep relaxation', tags: ['relaxation', 'muscle tension', 'guided'], thumbnail: '💆‍♂️' },
  { id: 12, code: 'ACT-403', title: 'Gratitude Journaling', type: 'activity', duration: '10 min', author: 'Positive Psychology Team', category: 'activities', description: 'Daily practice to cultivate appreciation', tags: ['gratitude', 'journaling', 'positive'], thumbnail: '✍️' },
  
  // Hobbies
  { id: 13, code: 'HOB-501', title: 'Watercolor Painting Basics', type: 'hobby', duration: '30 min', author: 'Art Therapy Institute', category: 'hobbies', description: 'Therapeutic painting techniques for beginners', tags: ['art', 'creativity', 'therapy'], thumbnail: '🎨' },
  { id: 14, code: 'HOB-502', title: 'Indoor Gardening Guide', type: 'hobby', duration: '45 min', author: 'Green Therapy', category: 'hobbies', description: 'Growing plants for mental wellness', tags: ['gardening', 'nature', 'care'], thumbnail: '🪴' },
  { id: 15, code: 'HOB-503', title: 'Beginner Knitting', type: 'hobby', duration: '60 min', author: 'Craft Wellness', category: 'hobbies', description: 'Meditative knitting patterns and techniques', tags: ['knitting', 'meditation', 'crafts'], thumbnail: '🧶' },
];
