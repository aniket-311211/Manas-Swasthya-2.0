export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  journal_text: string;
  images: string[]; // Array of image URLs
  voice_url?: string;
  stickers: StickerInstance[];
  ai_mood_summary?: MoodSummary;
  template_type: "cute" | "cool";
  created_at: Date;
  updated_at: Date;
  word_count: number;
}

export interface StickerInstance {
  id: string;
  sticker_id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface MoodSummary {
  primary_mood: "happy" | "sad" | "anxious" | "calm" | "excited" | "neutral";
  confidence: number; // 0-1
  emotions: EmotionScore[];
  insights: string;
  generated_at: Date;
}

export interface EmotionScore {
  emotion: string;
  score: number; // 0-1
}

export interface StickerItem {
  id: string;
  name: string;
  emoji: string;
  category: "emotion" | "decoration" | "activity" | "nature";
  template: "cute" | "cool" | "universal";
}

export interface JournalTemplate {
  id: "cute" | "cool";
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  patterns: string[];
}

export const MOOD_COLORS = {
  happy: "bg-yellow-100 border-yellow-400",
  sad: "bg-blue-100 border-blue-400",
  anxious: "bg-red-100 border-red-400",
  calm: "bg-green-100 border-green-400",
  excited: "bg-orange-100 border-orange-400",
  neutral: "bg-gray-100 border-gray-400",
};
