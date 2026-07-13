import React from "react";
import { Calendar } from "lucide-react";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const today = new Date().toISOString().split("T")[0];

  // Calculate max date (today) and min date (90 days ago)
  const maxDate = today;
  const minDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="mood-date"
        className="text-sm font-medium text-gray-700 flex items-center"
      >
        <Calendar className="w-4 h-4 mr-2" />
        Select Date
      </label>
      <div className="flex items-center space-x-3">
        <input
          id="mood-date"
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          min={minDate}
          max={maxDate}
          className="block w-auto px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
        />
        <span className="text-sm text-gray-600 font-medium">
          {formatDisplayDate(selectedDate)}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        You can update moods for up to 90 days in the past
      </p>
    </div>
  );
};

export default DateSelector;
