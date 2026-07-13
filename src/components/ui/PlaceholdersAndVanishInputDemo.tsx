"use client";

import { PlaceholdersAndVanishInput } from "../ui/placeholders-and-vanish-input";

interface PlaceholdersAndVanishInputDemoProps {
  onInputChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholders?: string[];
}

export function PlaceholdersAndVanishInputDemo({ 
  onInputChange, 
  onSubmit, 
  disabled = false,
  className,
  placeholders: customPlaceholders
}: PlaceholdersAndVanishInputDemoProps) {
  const defaultPlaceholders = [
    "How are you feeling today?",
    "Tell me what's on your mind...",
    "I'm here to listen and support you",
    "What's been causing you stress lately?",
    "How can I help you feel better?",
    "Share your thoughts with me",
    "Let's talk about your mental wellness"
  ];
  
  const placeholders = customPlaceholders || defaultPlaceholders;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onInputChange) {
      onInputChange(e.target.value);
    }
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const inputValue = formData.get('input') as string;
    if (onSubmit && inputValue?.trim()) {
      onSubmit(inputValue.trim());
    }
  };
  
  return (
    <div className="w-full">
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={handleSubmit}
        className={className}
      />
    </div>
  );
}
