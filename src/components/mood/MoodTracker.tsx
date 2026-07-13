import React, { useState, useEffect } from "react";
import { Save, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoodEntry, MoodType } from "@/types/mood";
import { api } from "@/lib/api";
import MoodSelector from "./MoodSelector";
import CommentInput from "./CommentInput";
import MoodCalendar from "./MoodCalendar";
import DayPopup from "./DayPopup";
import DateSelector from "./DateSelector";

interface MoodTrackerProps {
  userId?: string;
}

const MoodTracker: React.FC<MoodTrackerProps> = ({ userId }) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [comment, setComment] = useState("");
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<
    string | null
  >(null);
  const [selectedMoodEntry, setSelectedMoodEntry] = useState<
    MoodEntry | undefined
  >();
  const [isSaving, setIsSaving] = useState(false);

  // Load mood entries from API or localStorage
  useEffect(() => {
    const loadEntries = async () => {
      if (userId) {
        try {
          const entries = await api.getMoodHistory(userId);
          if (Array.isArray(entries)) {
            setMoodEntries(entries.map((e: any) => ({
              id: e.id,
              date: new Date(e.createdAt).toISOString().split('T')[0], // Approximation if date not stored explicitly
              mood: e.mood,
              comment: e.notes || '',
              timestamp: new Date(e.createdAt)
            })));
            return;
          }
        } catch (error) {
          console.error("Failed to load mood history from API:", error);
        }
      }

      // Fallback to LocalStorage
      const storageKey = userId ? `mood-entries-${userId}` : "mood-entries";
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const entries = JSON.parse(stored);
          setMoodEntries(
            entries.map((entry: any) => ({
              ...entry,
              timestamp: new Date(entry.timestamp),
            }))
          );
        } catch (error) {
          console.error("Error loading mood entries:", error);
        }
      }
    };
    loadEntries();
  }, [userId]);

  // Load mood for selected date when date changes or entries update
  useEffect(() => {
    const selectedEntry = moodEntries.find(
      (entry) => entry.date === selectedDate
    );

    if (selectedEntry) {
      setSelectedMood(selectedEntry.mood as MoodType);
      setComment(selectedEntry.comment);
    } else {
      setSelectedMood(null);
      setComment("");
    }
  }, [moodEntries, selectedDate]);

  const saveMoodEntry = async () => {
    if (!selectedMood) return;

    setIsSaving(true);

    try {
      const newEntry: MoodEntry = {
        id: `${selectedDate}-${Date.now()}`,
        date: selectedDate,
        mood: selectedMood,
        comment: comment.trim(),
        timestamp: new Date(),
      };

      // Remove existing entry for selected date if it exists
      const updatedEntries = moodEntries.filter(
        (entry) => entry.date !== selectedDate
      );
      updatedEntries.push(newEntry);

      // Sort entries by date (newest first)
      updatedEntries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMoodEntries(updatedEntries);

      // Save to API
      if (userId) {
        await api.saveMood({
          userId,
          mood: selectedMood,
          notes: comment.trim(),
          stress: 0, // Default or prompt user
          anxiety: 0,
          sleep: 0
        });
      }

      // Save to localStorage (Backup)
      const storageKey = userId ? `mood-entries-${userId}` : "mood-entries";
      localStorage.setItem(storageKey, JSON.stringify(updatedEntries));

      // Show success feedback
    } catch (error) {
      console.error("Error saving mood entry:", error);
      alert("Failed to save mood entry. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDayClick = (date: string, moodEntry?: MoodEntry) => {
    setCalendarSelectedDate(date);
    setSelectedMoodEntry(moodEntry);
  };

  const closePopup = () => {
    setCalendarSelectedDate(null);
    setSelectedMoodEntry(undefined);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const selectedEntry = moodEntries.find(
    (entry) => entry.date === selectedDate
  );
  const canSave = selectedMood && !isSaving;

  const formatSelectedDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (dateStr === today) return "today";
    if (dateStr === yesterday) return "yesterday";

    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Mood Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/60">
        {/* Date Selector */}
        <div className="mb-6">
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
        </div>

        {/* Update the title to reflect selected date */}
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            How were you feeling {formatSelectedDate(selectedDate)}?
          </h3>
        </div>

        <MoodSelector
          selectedMood={selectedMood}
          onMoodSelect={setSelectedMood}
        />

        {selectedMood && (
          <div className="mt-6 space-y-4">
            <CommentInput
              value={comment}
              onChange={setComment}
              maxLength={100}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={saveMoodEntry}
                  disabled={!canSave}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {selectedEntry ? "Update Mood" : "Save Mood"}
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowCalendar(!showCalendar)}
                  variant="outline"
                  className="px-4 py-2"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {showCalendar ? "Hide Calendar" : "View Calendar"}
                </Button>
              </div>

              {moodEntries.length > 0 && (
                <div className="text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  {moodEntries.length} mood{moodEntries.length === 1 ? "" : "s"}{" "}
                  tracked
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {showCalendar && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/60">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Mood Calendar
            </h3>
            <p className="text-gray-600 text-sm">
              Track your emotional journey over time. Each day shows your
              recorded mood.
            </p>
          </div>

          <MoodCalendar moodEntries={moodEntries} onDayClick={handleDayClick} />
        </div>
      )}

      {/* Day Popup */}
      {calendarSelectedDate && (
        <DayPopup
          date={calendarSelectedDate}
          moodEntry={selectedMoodEntry}
          onClose={closePopup}
        />
      )}
    </div>
  );
};

export default MoodTracker;
