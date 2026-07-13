import React from "react";
import { X } from "lucide-react";
import { MoodEntry, MOOD_LABELS } from "@/types/mood";

interface DayPopupProps {
  date: string;
  moodEntry?: MoodEntry;
  onClose: () => void;
}

const DayPopup: React.FC<DayPopupProps> = ({ date, moodEntry, onClose }) => {
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr === today;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 shadow-2xl border max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isToday(date) ? "Today" : formatDisplayDate(date)}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close popup"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {moodEntry ? (
          <div className="space-y-4">
            {/* Mood Display */}
            <div className="text-center py-4">
              <div className="text-6xl mb-2">{moodEntry.mood}</div>
              <p className="text-lg font-medium text-gray-700">
                {MOOD_LABELS[moodEntry.mood as keyof typeof MOOD_LABELS]}
              </p>
            </div>

            {/* Comment */}
            {moodEntry.comment && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Your note:
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  "{moodEntry.comment}"
                </p>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Logged on {new Date(moodEntry.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 text-gray-300">📝</div>
            <p className="text-gray-600 mb-2">No mood recorded for this day</p>
            <p className="text-sm text-gray-500">
              {isToday(date)
                ? "Use the mood tracker above to record how you're feeling today"
                : "Past moods help you understand your emotional patterns"}
            </p>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayPopup;
