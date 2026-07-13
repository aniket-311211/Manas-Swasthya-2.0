import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const CommentInput: React.FC<CommentInputProps> = ({
  value,
  onChange,
  maxLength = 100,
}) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor="mood-comment"
        className="text-sm font-medium text-gray-700"
      >
        Add a note about your mood 
      </label>
      <Textarea
        id="mood-comment"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What's on your mind today?"
        maxLength={maxLength}
        className="resize-none h-20 text-sm"
        rows={3}
      />
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">
          Share what's influencing your mood today
        </p>
        <span
          className={`text-xs ${
            value.length > maxLength * 0.9 ? "text-red-500" : "text-gray-400"
          }`}
        >
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

export default CommentInput;
