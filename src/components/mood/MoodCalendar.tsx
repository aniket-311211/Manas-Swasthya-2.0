import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MoodEntry, MOOD_COLORS } from "@/types/mood";

interface MoodCalendarProps {
  moodEntries: MoodEntry[];
  onDayClick: (date: string, mood?: MoodEntry) => void;
  currentMonth?: Date;
}

const MoodCalendar: React.FC<MoodCalendarProps> = ({
  moodEntries,
  onDayClick,
  currentMonth = new Date(),
}) => {
  const [viewDate, setViewDate] = useState(currentMonth);

  const today = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  // Create mood entry lookup by date
  const moodByDate = moodEntries.reduce((acc, entry) => {
    acc[entry.date] = entry;
    return acc;
  }, {} as Record<string, MoodEntry>);

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

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth("prev")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h3>

        <button
          onClick={() => navigateMonth("next")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Names Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="h-10" />;
          }

          const dateStr = formatDate(day);
          const moodEntry = moodByDate[dateStr];
          const isCurrentDay = isToday(day);
          const isFuture = isFutureDate(day);

          return (
            <button
              key={day}
              onClick={() => !isFuture && onDayClick(dateStr, moodEntry)}
              disabled={isFuture}
              className={`h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                isFuture
                  ? "text-gray-300 cursor-not-allowed"
                  : "hover:bg-gray-100 cursor-pointer"
              } ${isCurrentDay ? "ring-2 ring-teal-400 ring-offset-1" : ""} ${
                moodEntry
                  ? `${
                      MOOD_COLORS[moodEntry.mood as keyof typeof MOOD_COLORS]
                    } border-2`
                  : "border border-transparent hover:border-gray-200"
              }`}
              title={
                moodEntry
                  ? `${moodEntry.mood} - ${moodEntry.comment}`
                  : `Add mood for ${dateStr}`
              }
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className={moodEntry ? "text-xs" : ""}>{day}</span>
                {moodEntry && (
                  <span className="text-xs leading-none">{moodEntry.mood}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Click on any day to view or add your mood • Today is outlined
        </p>
      </div>
    </div>
  );
};

export default MoodCalendar;
