import { motion } from 'motion/react';
import ManasOrb from './ManasOrb';

export interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

/**
 * Assistant speaks in frosted glass, you speak in solid ink — the same two
 * surfaces the dashboard uses, so the conversation reads as part of the app
 * rather than a widget dropped into it.
 */
export default function MessageBubble({ msg }: { msg: UiMessage }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && <ManasOrb state="idle" />}
      <div
        className={`max-w-[76%] rounded-[20px] px-4 py-3 text-[15px] leading-relaxed ${
          isUser
            ? 'rounded-br-md border border-white/15 bg-[#141C28] text-[#E8ECF3]'
            : 'rounded-bl-md border border-white/70 bg-white/80 text-[#1B2430] shadow-[0_8px_32px_rgba(27,36,48,0.08)] backdrop-blur-xl'
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className={`mt-1.5 font-mono text-[10px] ${isUser ? 'text-[#AEB8CA]' : 'text-[#8A93A3]'}`}>{msg.time}</p>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <ManasOrb state="thinking" />
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/70">Manas is thinking</span>
    </div>
  );
}
