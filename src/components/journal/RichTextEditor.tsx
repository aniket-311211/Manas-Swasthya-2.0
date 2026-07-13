import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  template: "cute" | "cool";
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your thoughts...",
  template,
}) => {
  const [selectedText, setSelectedText] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Fix backspace and delete behavior for LTR text
    if (e.key === "Backspace" || e.key === "Delete") {
      // Allow normal behavior but ensure proper cursor positioning
      e.stopPropagation();
    }
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const changeTextSize = (size: string) => {
    executeCommand("fontSize", size);
  };

  const toolbarButtonClass = `p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
    template === "cute"
      ? "hover:bg-pink-100 text-pink-700"
      : "hover:bg-blue-100 text-blue-700"
  }`;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
            <button
              onClick={() => executeCommand("bold")}
              className={toolbarButtonClass}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => executeCommand("italic")}
              className={toolbarButtonClass}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => executeCommand("underline")}
              className={toolbarButtonClass}
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
            <button
              onClick={() => executeCommand("insertUnorderedList")}
              className={toolbarButtonClass}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => executeCommand("insertOrderedList")}
              className={toolbarButtonClass}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
            <button
              onClick={() => executeCommand("justifyLeft")}
              className={toolbarButtonClass}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => executeCommand("justifyCenter")}
              className={toolbarButtonClass}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => executeCommand("justifyRight")}
              className={toolbarButtonClass}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Text Size */}
          <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
            <Type className="w-4 h-4 text-gray-500" />
            <select
              onChange={(e) => changeTextSize(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
              defaultValue="3"
            >
              <option value="1">Small</option>
              <option value="3">Normal</option>
              <option value="5">Large</option>
              <option value="7">XLarge</option>
            </select>
          </div>

          {/* Text Color */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-600">Color:</label>
            <input
              type="color"
              onChange={(e) => executeCommand("foreColor", e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              defaultValue={template === "cute" ? "#831843" : "#1E293B"}
            />
          </div>

          {/* Link */}
          <button
            onClick={insertLink}
            className={toolbarButtonClass}
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        dir="ltr"
        lang="en"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        className={`min-h-[300px] p-6 focus:outline-none prose max-w-none ${
          template === "cute"
            ? "font-serif text-pink-900"
            : "font-sans text-slate-800"
        }`}
        style={{
          fontFamily:
            template === "cute" ? "Quicksand, sans-serif" : "Inter, sans-serif",
          lineHeight: "1.6",
          direction: "ltr !important" as any,
          textAlign: "left" as const,
          unicodeBidi: "normal" as any,
          writingMode: "horizontal-tb" as any,
        }}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />

      {/* Character Count */}
      <div className="border-t border-gray-200 px-6 py-2 bg-gray-50/50">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            Words:{" "}
            {
              value
                .replace(/<[^>]*>/g, "")
                .trim()
                .split(/\s+/)
                .filter(Boolean).length
            }
          </span>
          <span>Characters: {value.replace(/<[^>]*>/g, "").length}</span>
        </div>
      </div>

      {/* Add custom CSS for placeholder and LTR fixes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9CA3AF;
            font-style: italic;
            direction: ltr !important;
            text-align: left !important;
          }
          
          /* Force LTR direction and prevent RTL inheritance */
          [contenteditable] {
            direction: ltr !important;
            text-align: left !important;
            unicode-bidi: normal !important;
            writing-mode: horizontal-tb !important;
          }
          
          [contenteditable] * {
            direction: ltr !important;
            text-align: inherit !important;
            unicode-bidi: normal !important;
          }
          
          /* Fix cursor and selection behavior */
          [contenteditable]:focus {
            direction: ltr !important;
            text-align: left !important;
          }
          
          /* Ensure proper text input direction */
          [contenteditable] p,
          [contenteditable] div,
          [contenteditable] span {
            direction: ltr !important;
            unicode-bidi: normal !important;
          }
        `,
        }}
      />
    </div>
  );
};

export default RichTextEditor;
