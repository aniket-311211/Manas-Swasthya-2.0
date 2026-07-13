import React, { useState, useEffect } from "react";
import { Save, Calendar, Smile, Mic, Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JournalEntry, StickerItem, StickerInstance } from "@/types/journal";
import { JOURNAL_TEMPLATES } from "@/data/journalData";
import TemplateSelector from "./TemplateSelector";
import SimpleTextEditor from "./SimpleTextEditor";
import ImageUpload from "./ImageUpload";
import VoiceRecorder from "./VoiceRecorder";
import StickerPalette from "./StickerPalette";
import { aiAnalyze } from "@/lib/ai";
import { useUser } from "@clerk/clerk-react";

interface JournalEditorProps {
  entry?: JournalEntry;
  date: string;
  onSave: (entry: Omit<JournalEntry, "id">) => void;
  onCancel: () => void;
}

const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  date,
  onSave,
  onCancel,
}) => {
  const { user } = useUser();
  const [template, setTemplate] = useState<"cute" | "cool">(
    entry?.template_type || "cute"
  );
  const [journalText, setJournalText] = useState(entry?.journal_text || "");
  const [images, setImages] = useState<string[]>(entry?.images || []);
  const [voiceUrl, setVoiceUrl] = useState<string | undefined>(
    entry?.voice_url
  );
  const [stickers, setStickers] = useState<StickerInstance[]>(
    entry?.stickers || []
  );
  const [showStickerPalette, setShowStickerPalette] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentTemplate = JOURNAL_TEMPLATES[template];

  const addSticker = (stickerItem: StickerItem) => {
    const newSticker: StickerInstance = {
      id: `sticker-${Date.now()}`,
      sticker_id: stickerItem.id,
      x: Math.random() * 200 + 50, // Random position
      y: Math.random() * 200 + 50,
      size: 1,
      rotation: 0,
    };
    setStickers([...stickers, newSticker]);
  };

  const removeSticker = (stickerId: string) => {
    setStickers(stickers.filter((s) => s.id !== stickerId));
  };

  const analyzeMoodWithAI = async (text: string) => {
    if (!text.trim()) return null;

    setIsAnalyzing(true);
    try {
      const result = await aiAnalyze(user?.id ?? "anonymous", text, "journal");
      const sentimentToMood: Record<string, string> = {
        positive: "happy",
        neutral: "neutral",
        mixed: "anxious",
        negative: "sad",
      };
      return {
        primary_mood: sentimentToMood[result.sentiment] ?? "neutral",
        confidence: 0.8,
        emotions: result.themes.map((t) => ({ emotion: t, score: 0.6 })),
        insights: result.gentleSuggestion,
        generated_at: new Date(),
      };
    } catch (error) {
      console.error("Error analyzing mood:", error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Analyze mood with AI
      const aiMoodSummary = await analyzeMoodWithAI(journalText);

      // Calculate word count (now with plain text)
      const wordCount = journalText.trim().split(/\s+/).filter(Boolean).length;

      const newEntry: Omit<JournalEntry, "id"> = {
        date,
        journal_text: journalText,
        images,
        voice_url: voiceUrl,
        stickers,
        ai_mood_summary: aiMoodSummary,
        template_type: template,
        created_at: entry?.created_at || new Date(),
        updated_at: new Date(),
        word_count: wordCount,
      };

      onSave(newEntry);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      alert("Failed to save journal entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className="min-h-screen p-4 journal-container"
      dir="ltr"
      lang="en"
      style={{
        background: currentTemplate.colors.background,
        fontFamily: currentTemplate.fonts.body,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6 journal-text-fix">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              color: currentTemplate.colors.text,
              fontFamily: currentTemplate.fonts.heading,
            }}
          >
            Svasthya Journal
          </h1>
          <div className="flex items-center justify-center space-x-2 text-lg">
            <Calendar
              className="w-5 h-5"
              style={{ color: currentTemplate.colors.primary }}
            />
            <span style={{ color: currentTemplate.colors.text }}>
              {formatDate(date)}
            </span>
          </div>
          <div className="flex justify-center mt-4 space-x-2">
            {currentTemplate.patterns.map((pattern, index) => (
              <span
                key={index}
                className="text-2xl animate-pulse"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>

        {/* Template Selector */}
        <TemplateSelector
          selectedTemplate={template}
          onTemplateChange={setTemplate}
        />

        {/* Main Editor */}
        <div className="grid lg:grid-cols-3 gap-6" dir="ltr" lang="en">
          {/* Left Column - Text Editor */}
          <div className="lg:col-span-2 space-y-6" dir="ltr">
            <SimpleTextEditor
              value={journalText}
              onChange={setJournalText}
              placeholder={`Dear Journal, today I feel ${currentTemplate.patterns[0]}...`}
              template={template}
            />

            {/* Media Upload */}
            <div className="grid md:grid-cols-2 gap-4">
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
              />

              <VoiceRecorder
                onRecordingComplete={setVoiceUrl}
                existingRecording={voiceUrl}
                onDeleteRecording={() => setVoiceUrl(undefined)}
              />
            </div>
          </div>

          {/* Right Column - Tools & Actions */}
          <div className="space-y-6">
            {/* Sticker Tools */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/60">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Sparkles
                  className="w-5 h-5 mr-2"
                  style={{ color: currentTemplate.colors.primary }}
                />
                Stickers
              </h3>

              <Button
                onClick={() => setShowStickerPalette(true)}
                variant="outline"
                className="w-full mb-4"
                style={{ borderColor: currentTemplate.colors.primary }}
              >
                <Smile className="w-4 h-4 mr-2" />
                Add Stickers
              </Button>

              {stickers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Active Stickers:</p>
                  <div className="flex flex-wrap gap-2">
                    {stickers.map((sticker) => (
                      <button
                        key={sticker.id}
                        onClick={() => removeSticker(sticker.id)}
                        className="p-2 bg-gray-100 hover:bg-red-100 rounded-lg transition-colors"
                        title="Click to remove"
                      >
                        <span className="text-lg">
                          {/* We'll need to map sticker_id to emoji */}
                          🎨
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Mood Analysis */}
            {journalText && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/60">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Sparkles
                    className="w-5 h-5 mr-2"
                    style={{ color: currentTemplate.colors.primary }}
                  />
                  AI Mood Insights
                </h3>

                {isAnalyzing ? (
                  <div className="text-center py-4">
                    <div
                      className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                      style={{ borderColor: currentTemplate.colors.primary }}
                    ></div>
                    <p className="text-sm text-gray-600">
                      Analyzing your mood...
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    AI will analyze your mood when you save this entry
                  </p>
                )}
              </div>
            )}

            {/* Save Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={isSaving || !journalText.trim()}
                className="w-full text-white"
                style={{ backgroundColor: currentTemplate.colors.primary }}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>

              <Button onClick={onCancel} variant="outline" className="w-full">
                Cancel
              </Button>
            </div>

            {/* Stats */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/60">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Entry Stats
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Words:</span>
                  <span>
                    {journalText.trim().split(/\s+/).filter(Boolean).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Images:</span>
                  <span>{images.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Voice Note:</span>
                  <span>{voiceUrl ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stickers:</span>
                  <span>{stickers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticker Palette Modal */}
        <StickerPalette
          isOpen={showStickerPalette}
          onClose={() => setShowStickerPalette(false)}
          template={template}
          onStickerSelect={addSticker}
        />
      </div>
    </div>
  );
};

export default JournalEditor;
