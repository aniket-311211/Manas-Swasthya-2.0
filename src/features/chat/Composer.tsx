import { useRef, useState } from 'react';
import { SendHorizonal } from 'lucide-react';

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export default function Composer({ disabled, onSend }: ComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    setValue('');
    onSend(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex items-end gap-2 rounded-[22px] border border-white/70 bg-white/80 p-2.5 shadow-[0_8px_32px_rgba(27,36,48,0.10)] backdrop-blur-xl">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder="Share what's on your mind…"
        aria-label="Message Manas"
        className="max-h-36 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-[#1B2430] placeholder:text-[#8A93A3] focus:outline-none"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B2430] text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59] focus-visible:ring-offset-2 disabled:opacity-40 disabled:hover:scale-100"
      >
        <SendHorizonal className="h-4 w-4" />
      </button>
    </div>
  );
}
