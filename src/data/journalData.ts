import { StickerItem, JournalTemplate } from "@/types/journal";

export const STICKER_LIBRARY: StickerItem[] = [
  // Universal stickers
  {
    id: "heart",
    name: "Heart",
    emoji: "❤️",
    category: "emotion",
    template: "universal",
  },
  {
    id: "smile",
    name: "Smile",
    emoji: "😊",
    category: "emotion",
    template: "universal",
  },
  {
    id: "star",
    name: "Star",
    emoji: "⭐",
    category: "decoration",
    template: "universal",
  },
  {
    id: "sun",
    name: "Sun",
    emoji: "☀️",
    category: "nature",
    template: "universal",
  },
  {
    id: "moon",
    name: "Moon",
    emoji: "🌙",
    category: "nature",
    template: "universal",
  },

  // cute stickers
  {
    id: "pink_heart",
    name: "Pink Heart",
    emoji: "💖",
    category: "emotion",
    template: "cute",
  },
  {
    id: "flower",
    name: "Flower",
    emoji: "🌸",
    category: "decoration",
    template: "cute",
  },
  {
    id: "butterfly",
    name: "Butterfly",
    emoji: "🦋",
    category: "nature",
    template: "cute",
  },
  {
    id: "sparkles",
    name: "Sparkles",
    emoji: "✨",
    category: "decoration",
    template: "cute",
  },
  {
    id: "cherry",
    name: "Cherry",
    emoji: "🍒",
    category: "decoration",
    template: "cute",
  },
  {
    id: "unicorn",
    name: "Unicorn",
    emoji: "🦄",
    category: "decoration",
    template: "cute",
  },
  {
    id: "crown",
    name: "Crown",
    emoji: "👑",
    category: "decoration",
    template: "cute",
  },
  {
    id: "lipstick",
    name: "Lipstick",
    emoji: "💄",
    category: "decoration",
    template: "cute",
  },
  {
    id: "nail_polish",
    name: "Nail Polish",
    emoji: "💅",
    category: "decoration",
    template: "cute",
  },
  {
    id: "rose",
    name: "Rose",
    emoji: "🌹",
    category: "nature",
    template: "cute",
  },

  // cool stickers
  {
    id: "thumbs_up",
    name: "Thumbs Up",
    emoji: "👍",
    category: "emotion",
    template: "cool",
  },
  {
    id: "fire",
    name: "Fire",
    emoji: "🔥",
    category: "decoration",
    template: "cool",
  },
  {
    id: "rocket",
    name: "Rocket",
    emoji: "🚀",
    category: "activity",
    template: "cool",
  },
  {
    id: "trophy",
    name: "Trophy",
    emoji: "🏆",
    category: "activity",
    template: "cool",
  },
  {
    id: "soccer",
    name: "Soccer",
    emoji: "⚽",
    category: "activity",
    template: "cool",
  },
  {
    id: "basketball",
    name: "Basketball",
    emoji: "🏀",
    category: "activity",
    template: "cool",
  },
  {
    id: "lightning",
    name: "Lightning",
    emoji: "⚡",
    category: "decoration",
    template: "cool",
  },
  {
    id: "gear",
    name: "Gear",
    emoji: "⚙️",
    category: "decoration",
    template: "cool",
  },
  {
    id: "mountain",
    name: "Mountain",
    emoji: "🏔️",
    category: "nature",
    template: "cool",
  },
  {
    id: "gamepad",
    name: "Gamepad",
    emoji: "🎮",
    category: "activity",
    template: "cool",
  },
];

export const JOURNAL_TEMPLATES: Record<"cute" | "cool", JournalTemplate> = {
  cute: {
    id: "cute",
    name: "cute",
    colors: {
      primary: "#F472B6", // pink-400
      secondary: "#C084FC", // purple-400
      accent: "#FB7185", // rose-400
      background:
        "linear-gradient(135deg, #FDF2F8 0%, #FAE8FF 50%, #FEF7FF 100%)",
      text: "#831843", // pink-900
    },
    fonts: {
      heading: "Dancing Script, cursive",
      body: "Quicksand, sans-serif",
    },
    patterns: ["🌸", "🦋", "💖", "✨", "🌺"],
  },
  cool: {
    id: "cool",
    name: "cool",
    colors: {
      primary: "#3B82F6", // blue-500
      secondary: "#6B7280", // gray-500
      accent: "#10B981", // emerald-500
      background:
        "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #F1F5F9 100%)",
      text: "#1E293B", // slate-800
    },
    fonts: {
      heading: "Inter, sans-serif",
      body: "Inter, sans-serif",
    },
    patterns: ["⚡", "🔥", "🚀", "⚙️", "🎯"],
  },
};
