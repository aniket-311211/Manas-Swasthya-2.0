import React, { useState, useEffect } from "react";
import {
  Calendar,
  Edit,
  BookOpen,
  Sparkles,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JournalEntry } from "@/types/journal";
import { useUser } from "@clerk/clerk-react";
import { api } from "@/lib/api";
import { getJournalStorage } from "@/utils/journalStorage";
import JournalEditor from "./JournalEditor";
import CalendarView from "./CalendarView";

const SvasthyaJournal: React.FC = () => {
  const { user } = useUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentView, setCurrentView] = useState<"calendar" | "editor">(
    "calendar"
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>();
  const [statistics, setStatistics] = useState({
    totalEntries: 0,
    currentMonthEntries: 0,
    totalWords: 0,
    averageWords: 0,
    longestStreak: 0,
    topMood: null as string | null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const journalStorage = getJournalStorage(user?.id);

  // Load entries from localStorage on component mount
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setIsLoading(true);
        const loadedEntries = await journalStorage.loadEntries();
        setEntries(loadedEntries);

        // Calculate and set statistics
        const stats = journalStorage.getStatistics(loadedEntries);
        setStatistics(stats);
      } catch (error) {
        console.error("Error loading journal entries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [user?.id, journalStorage]);

  // Remove the saveEntries function as it's now handled by journalStorage
  // const saveEntries = ... (removed)

  const handleSaveEntry = async (entryData: Omit<JournalEntry, "id">) => {
    try {
      const now = new Date();
      const newEntry: JournalEntry = {
        id:
          editingEntry?.id ||
          `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...entryData,
        updated_at: now,
        created_at: editingEntry?.created_at || now,
        // Ensure word count is calculated
        word_count: entryData.journal_text
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length,
      };

      const updatedEntries = await journalStorage.saveEntry(newEntry, entries);
      setEntries(updatedEntries);

      // Sync core fields to backend (fire-and-forget)
      if (user?.id) {
        api
          .createJournal({
            clerkId: user.id,
            title: newEntry.title || null,
            content: newEntry.journal_text,
            mood: newEntry.mood_summary?.primary_mood ?? null,
            tags: [],
          })
          .catch(() => undefined);
      }

      // Update statistics
      const stats = journalStorage.getStatistics(updatedEntries);
      setStatistics(stats);

      setCurrentView("calendar");
      setEditingEntry(undefined);
      setSelectedDate("");

      console.log(
        editingEntry
          ? "Journal entry updated successfully"
          : "New journal entry created successfully"
      );
    } catch (error) {
      console.error("Error saving journal entry:", error);
      // Could add user notification here
    }
  };

  const handleDateSelect = (date: string) => {
    const entry = entries.find((e) => e.date === date);
    if (entry) {
      setEditingEntry(entry);
      setSelectedDate(date);
      setCurrentView("editor");
    }
  };

  const handleNewEntry = (date: string) => {
    setEditingEntry(undefined);
    setSelectedDate(date);
    setCurrentView("editor");
  };

  const handleCancel = () => {
    setCurrentView("calendar");
    setEditingEntry(undefined);
    setSelectedDate("");
  };

  // Calculate stats from entries for backward compatibility
  const currentMonthEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    const now = new Date();
    return (
      entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear()
    );
  });

  const totalWords = entries.reduce((sum, entry) => sum + entry.word_count, 0);
  const averageWordsPerEntry =
    entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journal...</p>
        </div>
      </div>
    );
  }

  if (currentView === "editor") {
    return (
      <JournalEditor
        entry={editingEntry}
        date={selectedDate}
        onSave={handleSaveEntry}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 journal-container"
      dir="ltr"
      lang="en"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            <BookOpen className="w-8 h-8 mr-3 text-purple-600" />
            Svasthya Journal
          </h1>
          <p className="text-gray-600 text-lg">
            Your personal space for reflection, growth, and self-discovery
          </p>
          <div className="flex justify-center mt-4 space-x-2">
            <span className="text-2xl animate-bounce">✨</span>
            <span
              className="text-2xl animate-bounce"
              style={{ animationDelay: "200ms" }}
            >
              🌸
            </span>
            <span
              className="text-2xl animate-bounce"
              style={{ animationDelay: "400ms" }}
            >
              💖
            </span>
            <span
              className="text-2xl animate-bounce"
              style={{ animationDelay: "600ms" }}
            >
              🦋
            </span>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Entries
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalEntries}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.currentMonthEntries}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Writing Streak
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.longestStreak} days
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Mood</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.topMood ? (
                    <span className="capitalize">
                      {statistics.topMood === "happy" && "😊 Happy"}
                      {statistics.topMood === "sad" && "😔 Sad"}
                      {statistics.topMood === "anxious" && "😰 Anxious"}
                      {statistics.topMood === "calm" && "😌 Calm"}
                      {statistics.topMood === "excited" && "🤩 Excited"}
                      {statistics.topMood === "neutral" && "😐 Neutral"}
                    </span>
                  ) : (
                    <span className="text-gray-400">No data</span>
                  )}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-6">
          <Button
            onClick={() =>
              handleNewEntry(new Date().toISOString().split("T")[0])
            }
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg"
          >
            <Edit className="w-5 h-5 mr-2" />
            Write Today's Entry
          </Button>
        </div>

        {/* Compact Calendar Section */}
        <div className="flex justify-center mb-6">
          <CalendarView
            entries={entries}
            onDateSelect={handleDateSelect}
            onNewEntry={handleNewEntry}
          />
        </div>

        {/* Recent Entries Quick Preview */}
        {entries.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/60">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
              Recent Entries
            </h3>
            <div className="space-y-3">
              {entries.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleDateSelect(entry.date)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      {entry.ai_mood_summary ? (
                        <span className="text-lg">
                          {entry.ai_mood_summary.primary_mood === "happy" &&
                            "😊"}
                          {entry.ai_mood_summary.primary_mood === "sad" && "😔"}
                          {entry.ai_mood_summary.primary_mood === "anxious" &&
                            "😰"}
                          {entry.ai_mood_summary.primary_mood === "calm" &&
                            "😌"}
                          {entry.ai_mood_summary.primary_mood === "excited" &&
                            "🤩"}
                          {entry.ai_mood_summary.primary_mood === "neutral" &&
                            "😐"}
                        </span>
                      ) : (
                        <FileText className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {entry.word_count} words
                        {entry.images.length > 0 &&
                          ` • ${entry.images.length} images`}
                        {entry.voice_url && " • Voice note"}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {entry.journal_text.slice(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {entries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📔</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Start Your Journal Journey
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Begin documenting your thoughts, feelings, and daily experiences.
              Each entry helps you understand yourself better.
            </p>
            <Button
              onClick={() =>
                handleNewEntry(new Date().toISOString().split("T")[0])
              }
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3"
            >
              <Edit className="w-5 h-5 mr-2" />
              Write Your First Entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SvasthyaJournal;
