import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bold, Italic, List, Type, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  template: "cute" | "cool";
}

const SimpleTextEditor: React.FC<SimpleTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Dear journal, today I feel...",
  template,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // Template-based styling
  const templateStyles = {
    cute: {
      background:
        "linear-gradient(135deg, #FDF2F8 0%, #FAE8FF 50%, #FEF7FF 100%)",
      borderColor: "#F472B6",
      textColor: "#831843",
      accentColor: "#EC4899",
      fontFamily: "Quicksand, sans-serif",
    },
    cool: {
      background:
        "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #F1F5F9 100%)",
      borderColor: "#3B82F6",
      textColor: "#1E293B",
      accentColor: "#2563EB",
      fontFamily: "Inter, sans-serif",
    },
  };

  const currentStyle = templateStyles[template];

  const updateCounts = useCallback(() => {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const chars = value.length;
    setWordCount(words);
    setCharCount(chars);
  }, [value]);

  useEffect(() => {
    updateCounts();
  }, [updateCounts]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enhanced keyboard handling for better text editing experience
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue =
        value.substring(0, start) + "    " + value.substring(end);
      onChange(newValue);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const insertFormatting = (format: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = value.substring(start, end);

    let formattedText = "";
    let cursorOffset = 0;

    switch (format) {
      case "bold": {
        formattedText = selectedText ? `**${selectedText}**` : "**bold text**";
        cursorOffset = selectedText ? 2 : 2;
        break;
      }
      case "italic": {
        formattedText = selectedText ? `*${selectedText}*` : "*italic text*";
        cursorOffset = selectedText ? 1 : 1;
        break;
      }
      case "list": {
        const lines = selectedText.split("\n");
        formattedText = lines
          .map((line) => (line.trim() ? `• ${line.trim()}` : "• "))
          .join("\n");
        cursorOffset = 2;
        break;
      }
      default:
        return;
    }

    const newValue =
      value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);

    // Set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = selectedText
          ? start + formattedText.length
          : start + cursorOffset;
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          newPosition;
      }
    }, 0);
  };

  const insertTemplate = (templateText: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const newValue =
      value.substring(0, start) + templateText + value.substring(start);
    onChange(newValue);

    // Set cursor position after inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          start + templateText.length;
      }
    }, 0);
  };

  const journalPrompts =
    template === "cute"
      ? [
          "Today I'm grateful for...",
          "Something that made me smile today was...",
          "I'm feeling... because...",
          "My biggest accomplishment today was...",
          "Tomorrow I want to focus on...",
        ]
      : [
          "Today's key events:",
          "What I learned today:",
          "Challenges I faced:",
          "Goals for tomorrow:",
          "Personal reflection:",
        ];

  return (
    <div className="space-y-4">
      {/* Simple Toolbar */}
      <div
        className="flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200"
        style={{
          background: currentStyle.background,
          borderColor: isFocused ? currentStyle.borderColor : "#E5E7EB",
        }}
      >
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("bold")}
            className="h-8 w-8 p-0 hover:scale-110 transition-transform"
            style={{ color: currentStyle.accentColor }}
            title="Bold (Markdown: **text**)"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("italic")}
            className="h-8 w-8 p-0 hover:scale-110 transition-transform"
            style={{ color: currentStyle.accentColor }}
            title="Italic (Markdown: *text*)"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("list")}
            className="h-8 w-8 p-0 hover:scale-110 transition-transform"
            style={{ color: currentStyle.accentColor }}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <div
          className="flex items-center space-x-3 text-sm"
          style={{ color: currentStyle.textColor }}
        >
          <span className="hidden sm:block">{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* Main Text Area */}
      <div
        className="relative rounded-2xl border-2 transition-all duration-200 overflow-hidden"
        style={{
          background: currentStyle.background,
          borderColor: isFocused ? currentStyle.borderColor : "#E5E7EB",
          boxShadow: isFocused
            ? `0 0 0 3px ${currentStyle.borderColor}20`
            : "none",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          dir="ltr"
          lang="en"
          className="w-full h-80 p-6 bg-transparent border-none outline-none resize-none placeholder-gray-400 journal-text-fix"
          style={{
            fontFamily: currentStyle.fontFamily,
            fontSize: "16px",
            lineHeight: "1.6",
            color: currentStyle.textColor,
            direction: "ltr",
            textAlign: "left",
            unicodeBidi: "normal",
            writingMode: "horizontal-tb",
          }}
          spellCheck={true}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
        />

        {/* Floating Character Limit Indicator */}
        {charCount > 800 && (
          <div
            className="absolute bottom-4 right-4 px-2 py-1 rounded text-xs bg-white/80 backdrop-blur-sm"
            style={{
              color: charCount > 1000 ? "#EF4444" : currentStyle.accentColor,
              borderColor:
                charCount > 1000 ? "#EF4444" : currentStyle.borderColor,
            }}
          >
            {charCount}/1000
          </div>
        )}
      </div>

      {/* Quick Templates */}
      <div className="space-y-2">
        <p
          className="text-sm font-medium"
          style={{ color: currentStyle.textColor }}
        >
          Quick starts:
        </p>
        <div className="flex flex-wrap gap-2">
          {journalPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => insertTemplate(prompt + " ")}
              className="px-3 py-1 text-xs rounded-full border transition-all duration-200 hover:scale-105"
              style={{
                borderColor: currentStyle.borderColor,
                color: currentStyle.accentColor,
                backgroundColor: "rgba(255, 255, 255, 0.5)",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Writing Tips */}
      <div
        className="p-4 rounded-xl text-sm"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          borderLeft: `4px solid ${currentStyle.borderColor}`,
        }}
      >
        <p
          className="font-medium mb-1"
          style={{ color: currentStyle.textColor }}
        >
          💡 Writing Tips:
        </p>
        <p style={{ color: currentStyle.textColor, opacity: 0.8 }}>
          Use **bold** for important thoughts, *italic* for emotions, and bullet
          points for lists. Write freely and let your thoughts flow naturally.
        </p>
      </div>
    </div>
  );
};

export default SimpleTextEditor;
