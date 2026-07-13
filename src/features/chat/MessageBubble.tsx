import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

export interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export default function MessageBubble({ msg }: { msg: UiMessage }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-light to-primary-dark shadow-soft">
          <Brain className="h-4 w-4 text-primary-foreground" />
        </span>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft ${
          isUser
            ? 'rounded-br-md bg-gradient-to-br from-primary-light to-primary-dark text-primary-foreground'
            : 'rounded-bl-md border border-border bg-card text-foreground'
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className={`mt-1.5 text-[10px] ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {msg.time}
        </p>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-light to-primary-dark shadow-soft">
        <Brain className="h-4 w-4 text-primary-foreground" />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 shadow-soft">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}
