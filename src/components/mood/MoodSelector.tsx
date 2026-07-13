import React from "react";
import { MoodType, MOOD_EMOJIS, MOOD_LABELS } from "@/types/mood";

interface MoodSelectorProps {
  selectedMood: MoodType | null;
  onMoodSelect: (mood: MoodType) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onMoodSelect,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex space-x-6 justify-center">
        {MOOD_EMOJIS.map((emoji) => (
          <div key={emoji} className="flex flex-col items-center space-y-2">
            <button
              onClick={() => onMoodSelect(emoji)}
              aria-label={`Select mood ${MOOD_LABELS[emoji]}`}
              className={`w-16 h-16 rounded-full text-4xl transition-all duration-300 flex items-center justify-center border-3 focus:outline-none focus:ring-4 focus:ring-teal-300 hover:scale-110 ${
                selectedMood === emoji
                  ? "bg-teal-100 border-teal-400 scale-110 shadow-lg"
                  : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg"
              }`}
              type="button"
            >
              {emoji}
            </button>
            <span
              className={`text-sm font-medium transition-colors ${
                selectedMood === emoji
                  ? "text-teal-700 font-semibold"
                  : "text-gray-600"
              }`}
            >
              {MOOD_LABELS[emoji]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;
