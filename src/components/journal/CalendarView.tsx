import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen,
  Sparkles,
  Calendar,
} from "lucide-react";
import { JournalEntry, MOOD_COLORS } from "@/types/journal";
import { CacheManager } from "@/utils/cacheUtils";

interface CalendarViewProps {
  entries: JournalEntry[];
  onDateSelect: (date: string) => void;
  onNewEntry: (date: string) => void;
  currentMonth?: Date;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  onDateSelect,
  onNewEntry,
  currentMonth = new Date(),
}) => {
  const [viewDate, setViewDate] = useState(currentMonth);

  // Clear any cached calendar styling on component mount
  useEffect(() => {
    CacheManager.clearComponentCache("calendar");
    // Add a unique class to prevent style conflicts
    document.body.classList.add("journal-calendar-active");

    return () => {
      document.body.classList.remove("journal-calendar-active");
    };
  }, []);

  const today = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  // Create entry lookup by date
  const entriesByDate = entries.reduce((acc, entry) => {
    acc[entry.date] = entry;
    return acc;
  }, {} as Record<string, JournalEntry>);

  const navigateMonth = (direction: "prev" | "next") => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isFutureDate = (day: number) => {
    const date = new Date(year, month, day);
    return date > today;
  };

  // Generate calendar days
  const calendarDays = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const getMoodColorClass = (entry?: JournalEntry) => {
    if (!entry?.ai_mood_summary) return "bg-gray-50 border-gray-200";
    const mood = entry.ai_mood_summary.primary_mood;
    return MOOD_COLORS[mood] || "bg-gray-50 border-gray-200";
  };

  return (
    <div className="journal-calendar-container bg-gradient-to-br from-purple-50/20 via-white/90 to-purple-100/30 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-200/20 w-full max-w-4xl mx-auto overflow-hidden">
      {/* Elegant Header */}
      <div className="calendar-header flex items-center justify-between mb-3">
        <button
          onClick={() => navigateMonth("prev")}
          className="p-2 hover:bg-purple-200/40 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 group shadow-sm"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4 text-purple-700 group-hover:text-purple-800" />
        </button>

        <div className="text-center flex-1">
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-800 via-purple-600 to-purple-700 bg-clip-text text-transparent mb-1">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center justify-center space-x-1 text-xs">
            <div className="bg-purple-100/60 rounded-full p-1">
              <Calendar className="w-3 h-3 text-purple-600" />
            </div>
            <span className="font-medium text-purple-600/80">
              {
                entries.filter((e) => {
                  const entryDate = new Date(e.date);
                  return (
                    entryDate.getMonth() === month &&
                    entryDate.getFullYear() === year
                  );
                }).length
              }{" "}
              entries
            </span>
          </div>
        </div>

        <button
          onClick={() => navigateMonth("next")}
          className="p-2 hover:bg-purple-200/40 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 group shadow-sm"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4 text-purple-700 group-hover:text-purple-800" />
        </button>
      </div>

      {/* Enhanced Day Names Header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayNames.map((day) => (
          <div
            key={day}
            className="calendar-day-header text-center text-sm font-semibold py-3"
          >
            {day.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Enhanced Calendar Grid with Larger Cells */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="h-16" />;
          }

          const dateStr = formatDate(day);
          const entry = entriesByDate[dateStr];
          const isCurrentDay = isToday(day);
          const isFuture = isFutureDate(day);

          // Get mood info for display
          const getMoodInfo = () => {
            if (!entry?.ai_mood_summary) return null;
            const mood = entry.ai_mood_summary.primary_mood;
            const moodEmojis = {
              happy: {
                emoji: "😊",
                label: "Happy",
                color: "from-yellow-200/50 to-orange-200/50",
              },
              sad: {
                emoji: "😔",
                label: "Sad",
                color: "from-blue-200/50 to-indigo-200/50",
              },
              anxious: {
                emoji: "😰",
                label: "Anxious",
                color: "from-red-200/50 to-pink-200/50",
              },
              calm: {
                emoji: "😌",
                label: "Calm",
                color: "from-green-200/50 to-emerald-200/50",
              },
              excited: {
                emoji: "🤩",
                label: "Excited",
                color: "from-purple-200/50 to-pink-200/50",
              },
              neutral: {
                emoji: "😐",
                label: "Neutral",
                color: "from-gray-200/50 to-slate-200/50",
              },
            };
            return moodEmojis[mood] || null;
          };

          const moodInfo = getMoodInfo();

          return (
            <div
              key={day}
              className={`calendar-day-cell h-16 rounded-xl border transition-all duration-300 relative group cursor-pointer ${
                entry && moodInfo
                  ? `bg-gradient-to-br ${moodInfo.color} border-purple-300/30 shadow-sm`
                  : "bg-gradient-to-br from-white/80 to-purple-50/30 border-purple-200/20"
              } ${
                isCurrentDay
                  ? "ring-2 ring-purple-500/60 ring-offset-1 shadow-lg scale-105"
                  : ""
              } ${
                isFuture
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:shadow-md hover:scale-105 hover:border-purple-300/50"
              }`}
              onClick={() =>
                !isFuture &&
                (entry ? onDateSelect(dateStr) : onNewEntry(dateStr))
              }
            >
              {/* Day Number */}
              <div className="absolute top-1 left-2 text-sm font-semibold text-purple-800/80">
                {day}
              </div>

              {/* Content Area - Centered Mood Display */}
              <div className="calendar-cell-content p-2 pt-6">
                {entry ? (
                  <div className="flex flex-col items-center space-y-1">
                    {/* Centered Mood Display with Text */}
                    {moodInfo && (
                      <div className="flex flex-col items-center space-y-0.5">
                        <div className="text-lg leading-none">
                          {moodInfo.emoji}
                        </div>
                        <div className="text-xs font-medium text-purple-700 text-center">
                          {moodInfo.label}
                        </div>
                      </div>
                    )}

                    {/* Content Indicators */}
                    <div className="flex space-x-1 mt-1">
                      {entry.images.length > 0 && (
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"
                          title={`${entry.images.length} images`}
                        />
                      )}
                      {entry.voice_url && (
                        <div
                          className="w-2 h-2 bg-purple-500 rounded-full shadow-sm"
                          title="Voice note"
                        />
                      )}
                      {entry.stickers.length > 0 && (
                        <div
                          className="w-2 h-2 bg-pink-500 rounded-full shadow-sm"
                          title={`${entry.stickers.length} stickers`}
                        />
                      )}
                    </div>
                  </div>
                ) : !isFuture ? (
                  <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-60 transition-opacity">
                    <Plus className="w-4 h-4 text-purple-500" />
                  </div>
                ) : null}
              </div>

              {/* Enhanced Tooltip with Word Count */}
              {entry && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap shadow-xl border border-gray-700">
                  <div className="text-center">
                    <div className="font-medium">{entry.word_count} words</div>
                    {moodInfo && (
                      <div className="text-gray-300 text-xs">
                        {moodInfo.emoji} {moodInfo.label}
                      </div>
                    )}
                    {(entry.images.length > 0 ||
                      entry.voice_url ||
                      entry.stickers.length > 0) && (
                      <div className="text-gray-400 text-xs mt-1">
                        {entry.images.length > 0 &&
                          `📷 ${entry.images.length} `}
                        {entry.voice_url && "🎤 "}
                        {entry.stickers.length > 0 &&
                          `✨ ${entry.stickers.length}`}
                      </div>
                    )}
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enhanced Legend */}
      <div className="border-t border-gradient-to-r from-purple-200/30 to-purple-300/30 pt-4 bg-gradient-to-r from-purple-50/20 to-purple-100/20 rounded-b-2xl mx-1">
        <div className="flex items-center justify-center space-x-4 text-sm mb-3">
          <div className="flex items-center space-x-2 bg-white/40 rounded-full px-3 py-2 border border-purple-100/40 shadow-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm" />
            <span className="text-purple-700 font-medium">Photos</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/40 rounded-full px-3 py-2 border border-purple-100/40 shadow-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full shadow-sm" />
            <span className="text-purple-700 font-medium">Voice</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/40 rounded-full px-3 py-2 border border-purple-100/40 shadow-sm">
            <div className="w-2 h-2 bg-pink-500 rounded-full shadow-sm" />
            <span className="text-purple-700 font-medium">Stickers</span>
          </div>
        </div>

        <p className="text-sm text-purple-600/70 text-center font-medium">
          💭 Click any day to write or view entries • Hover for details
        </p>
      </div>
    </div>
  );
};

export default CalendarView;
