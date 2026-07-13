import React, { useState } from "react";
import { Smile, X } from "lucide-react";
import { StickerItem } from "@/types/journal";
import { STICKER_LIBRARY } from "@/data/journalData";

interface StickerPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  template: "cute" | "cool";
  onStickerSelect: (sticker: StickerItem) => void;
}

const StickerPalette: React.FC<StickerPaletteProps> = ({
  isOpen,
  onClose,
  template,
  onStickerSelect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen) return null;

  // Filter stickers based on template and category
  const availableStickers = STICKER_LIBRARY.filter(
    (sticker) =>
      sticker.template === "universal" || sticker.template === template
  );

  const filteredStickers =
    selectedCategory === "all"
      ? availableStickers
      : availableStickers.filter(
          (sticker) => sticker.category === selectedCategory
        );

  const categories = [
    { id: "all", name: "All", icon: "🎨" },
    { id: "emotion", name: "Emotions", icon: "😊" },
    { id: "decoration", name: "Decorations", icon: "✨" },
    { id: "activity", name: "Activities", icon: "🎯" },
    { id: "nature", name: "Nature", icon: "🌿" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 shadow-2xl border max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Smile className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Sticker Palette
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? template === "cute"
                    ? "bg-pink-100 text-pink-700 border border-pink-300"
                    : "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Sticker Grid */}
        <div className="grid grid-cols-6 gap-3 max-h-60 overflow-y-auto">
          {filteredStickers.map((sticker) => (
            <button
              key={sticker.id}
              onClick={() => {
                onStickerSelect(sticker);
                onClose();
              }}
              className="aspect-square bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110 active:scale-95"
              title={sticker.name}
            >
              {sticker.emoji}
            </button>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-600 text-center">
            Click a sticker to add it to your journal. You can drag and resize
            stickers after placing them.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StickerPalette;
