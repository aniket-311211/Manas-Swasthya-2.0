import { JournalEntry } from "@/types/journal";

export class JournalStorageManager {
  private static instance: JournalStorageManager;
  private storageKey: string;

  private constructor(userId?: string) {
    this.storageKey = userId ? `journal-entries-${userId}` : "journal-entries";
  }

  static getInstance(userId?: string): JournalStorageManager {
    if (!JournalStorageManager.instance) {
      JournalStorageManager.instance = new JournalStorageManager(userId);
    }
    return JournalStorageManager.instance;
  }

  /**
   * Load journal entries from localStorage
   */
  async loadEntries(): Promise<JournalEntry[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const entries = JSON.parse(stored);
      if (!Array.isArray(entries)) return [];

      return entries.map(
        (entry: unknown): JournalEntry => {
          const e = entry as Record<string, unknown>;
          return {
            ...e,
            id: e.id as string,
            date: e.date as string,
            journal_text: e.journal_text as string,
            user_id: e.user_id as string | undefined,
            created_at: new Date(e.created_at as string | number | Date),
            updated_at: new Date(e.updated_at as string | number | Date),
            ai_mood_summary: e.ai_mood_summary
              ? {
                  ...(e.ai_mood_summary as Record<string, unknown>),
                  generated_at: new Date(
                    (e.ai_mood_summary as Record<string, unknown>).generated_at as
                      | string
                      | number
                      | Date
                  ),
                  mood_score: (e.ai_mood_summary as Record<string, unknown>)
                    .mood_score as number,
                  summary: (e.ai_mood_summary as Record<string, unknown>)
                    .summary as string,
                  keywords: (e.ai_mood_summary as Record<string, unknown>)
                    .keywords as string[],
                  recommendations: (e.ai_mood_summary as Record<string, unknown>)
                    .recommendations as string[],
                }
              : undefined,
            // Ensure required fields have defaults
            images: (e.images as string[]) || [],
            stickers: (e.stickers as string[]) || [],
            template_type: (e.template_type as "cute" | "cool") || "cute",
            word_count:
              (e.word_count as number) ||
              this.calculateWordCount((e.journal_text as string) || ""),
          };
        }
      );
    } catch (error) {
      console.error("Error loading journal entries:", error);
      // Try to load from backup
      return this.loadFromBackup();
    }
  }

  /**
   * Save journal entries to localStorage
   */
  async saveEntries(entries: JournalEntry[]): Promise<boolean> {
    try {
      // Validate entries
      const validEntries = entries.filter(this.validateEntry);

      // Sort by date (newest first)
      const sortedEntries = validEntries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Save primary data
      localStorage.setItem(this.storageKey, JSON.stringify(sortedEntries));

      // Create backup
      await this.createBackup(sortedEntries);

      console.log(`Successfully saved ${sortedEntries.length} journal entries`);
      return true;
    } catch (error) {
      console.error("Error saving journal entries:", error);
      return false;
    }
  }

  /**
   * Save a single entry
   */
  async saveEntry(
    entry: JournalEntry,
    existingEntries: JournalEntry[]
  ): Promise<JournalEntry[]> {
    // Ensure entry has required fields
    const completeEntry: JournalEntry = {
      ...entry,
      word_count: this.calculateWordCount(entry.journal_text),
      updated_at: new Date(),
    };

    const existingIndex = existingEntries.findIndex((e) => e.id === entry.id);
    let updatedEntries: JournalEntry[];

    if (existingIndex >= 0) {
      // Update existing entry
      updatedEntries = [...existingEntries];
      updatedEntries[existingIndex] = completeEntry;
    } else {
      // Add new entry
      updatedEntries = [...existingEntries, completeEntry];
    }

    await this.saveEntries(updatedEntries);
    return updatedEntries;
  }

  /**
   * Delete an entry
   */
  async deleteEntry(
    entryId: string,
    existingEntries: JournalEntry[]
  ): Promise<JournalEntry[]> {
    const updatedEntries = existingEntries.filter(
      (entry) => entry.id !== entryId
    );
    await this.saveEntries(updatedEntries);
    return updatedEntries;
  }

  /**
   * Get entries for a specific date range
   */
  getEntriesInRange(
    entries: JournalEntry[],
    startDate: Date,
    endDate: Date
  ): JournalEntry[] {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Get statistics for entries
   */
  getStatistics(entries: JournalEntry[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === currentMonth &&
        entryDate.getFullYear() === currentYear
      );
    });

    const totalWords = entries.reduce(
      (sum, entry) => sum + (entry.word_count || 0),
      0
    );
    const averageWords =
      entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

    const longestStreak = this.calculateWritingStreak(entries);
    const topMood = this.getMostFrequentMood(entries);

    return {
      totalEntries: entries.length,
      currentMonthEntries: currentMonthEntries.length,
      totalWords,
      averageWords,
      longestStreak,
      topMood,
    };
  }

  /**
   * Create a backup of entries
   */
  private async createBackup(entries: JournalEntry[]): Promise<void> {
    try {
      const backupKey = `${this.storageKey}-backup-${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(entries));

      // Clean up old backups (keep only last 5)
      const allKeys = Object.keys(localStorage)
        .filter((key) => key.startsWith(`${this.storageKey}-backup-`))
        .sort()
        .reverse();

      if (allKeys.length > 5) {
        allKeys.slice(5).forEach((key) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn("Could not create backup:", error);
    }
  }

  /**
   * Load from backup if main storage fails
   */
  private async loadFromBackup(): Promise<JournalEntry[]> {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter((key) => key.startsWith(`${this.storageKey}-backup-`))
        .sort()
        .reverse();

      if (backupKeys.length > 0) {
        const latestBackup = localStorage.getItem(backupKeys[0]);
        if (latestBackup) {
          console.log("Loaded entries from backup");
          return JSON.parse(latestBackup);
        }
      }
    } catch (error) {
      console.error("Error loading from backup:", error);
    }
    return [];
  }

  /**
   * Validate a journal entry
   */
  private validateEntry(entry: unknown): entry is JournalEntry {
    if (typeof entry !== "object" || entry === null) return false;
    
    const e = entry as Record<string, unknown>;
    return (
      typeof e.id === "string" &&
      typeof e.date === "string" &&
      typeof e.journal_text === "string" &&
      Array.isArray(e.images) &&
      Array.isArray(e.stickers)
    );
  }

  /**
   * Calculate word count for text
   */
  private calculateWordCount(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Calculate writing streak
   */
  private calculateWritingStreak(entries: JournalEntry[]): number {
    if (entries.length === 0) return 0;

    const sortedDates = entries
      .map((entry) => entry.date)
      .sort()
      .reverse(); // Most recent first

    let currentStreak = 0;
    let maxStreak = 0;
    let expectedDate = new Date();

    for (let i = 0; i < sortedDates.length; i++) {
      const entryDate = new Date(sortedDates[i]);
      const expectedDateStr = expectedDate.toISOString().split("T")[0];

      if (sortedDates[i] === expectedDateStr) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        currentStreak = 1;
        expectedDate = new Date(entryDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      }
    }

    return maxStreak;
  }

  /**
   * Get most frequent mood from recent entries
   */
  private getMostFrequentMood(entries: JournalEntry[]): string | null {
    const recentEntries = entries
      .filter((entry) => entry.ai_mood_summary)
      .slice(0, 7); // Last 7 entries

    if (recentEntries.length === 0) return null;

    const moodCounts = recentEntries.reduce((acc, entry) => {
      const mood = entry.ai_mood_summary!.primary_mood;
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0];
    return topMood ? topMood[0] : null;
  }

  /**
   * Export entries to JSON
   */
  exportEntries(entries: JournalEntry[]): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalEntries: entries.length,
      entries: entries.map((entry) => ({
        ...entry,
        created_at: entry.created_at.toISOString(),
        updated_at: entry.updated_at.toISOString(),
        ai_mood_summary: entry.ai_mood_summary
          ? {
              ...entry.ai_mood_summary,
              generated_at: entry.ai_mood_summary.generated_at.toISOString(),
            }
          : undefined,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all entries (with confirmation)
   */
  async clearAllEntries(): Promise<boolean> {
    try {
      // Create final backup before clearing
      const entries = await this.loadEntries();
      await this.createBackup(entries);

      // Clear main storage
      localStorage.removeItem(this.storageKey);

      console.log("All journal entries cleared");
      return true;
    } catch (error) {
      console.error("Error clearing entries:", error);
      return false;
    }
  }
}

// Export convenience functions
export const getJournalStorage = (userId?: string) =>
  JournalStorageManager.getInstance(userId);

export default JournalStorageManager;
