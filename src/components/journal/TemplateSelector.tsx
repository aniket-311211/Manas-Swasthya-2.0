import React from "react";
import { Palette } from "lucide-react";
import { JournalTemplate } from "@/types/journal";
import { JOURNAL_TEMPLATES } from "@/data/journalData";

interface TemplateSelectorProps {
  selectedTemplate: "cute" | "cool";
  onTemplateChange: (template: "cute" | "cool") => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateChange,
}) => {
  return (
    <div className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/60">
      <Palette className="w-5 h-5 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">Journal Style:</span>

      <div className="flex space-x-2">
        {Object.entries(JOURNAL_TEMPLATES).map(([key, template]) => (
          <button
            key={key}
            onClick={() => onTemplateChange(key as "cute" | "cool")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              selectedTemplate === key
                ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg scale-105"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            style={
              selectedTemplate === key && key === "cute"
                ? { background: "linear-gradient(135deg, #F472B6, #C084FC)" }
                : selectedTemplate === key && key === "cool"
                ? { background: "linear-gradient(135deg, #3B82F6, #6B7280)" }
                : {}
            }
          >
            <div className="flex items-center space-x-2">
              <span>{template.patterns[0]}</span>
              <span>{template.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
