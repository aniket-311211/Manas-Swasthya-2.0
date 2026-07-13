import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Aurora from '@/components/visual/Aurora';
import { aiChat } from '@/lib/ai';
import { api } from '@/lib/api';
import { detectCrisis } from '@/lib/crisis';
import CrisisBanner from '@/features/chat/CrisisBanner';
import Composer from '@/features/chat/Composer';
import MessageBubble, { TypingIndicator, type UiMessage } from '@/features/chat/MessageBubble';

const now = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export default function Chat() {
  const { t } = useTranslation();
  const { user } = useUser();
  const clerkId = user?.id ?? '';

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickPromptsRaw = t('chat.quickPrompts', { returnObjects: true });
  const quickPrompts = Array.isArray(quickPromptsRaw)
    ? (quickPromptsRaw as string[])
    : ['Exam stress is getting to me', 'I feel lonely at college', 'I can’t sleep properly', 'How do I stop overthinking?'];

  useEffect(() => {
    setMessages([{ id: 'intro', role: 'assistant', content: t('chat.intro', 'Hi, I’m Manas. This is your private, judgment-free space. What’s on your mind today?'), time: now() }]);
  }, [t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const ensureRoom = async (): Promise<string | null> => {
    if (roomId) return roomId;
    try {
      const room = await api.createChatRoom({ type: 'ai_chat', name: 'Manas chat', clerkId });
      setRoomId(room.id);
      return room.id;
    } catch {
      return null;
    }
  };

  const send = async (text: string) => {
    const userMsg: UiMessage = { id: `u-${Date.now()}`, role: 'user', content: text, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    if (detectCrisis(text)) setCrisis(true);
    setThinking(true);

    const history = [...messages, userMsg]
      .filter((m) => m.id !== 'intro')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const result = await aiChat(clerkId, history, localStorage.getItem('app_lang') ?? 'en');
      if (result.crisis) setCrisis(true);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: result.reply, time: now() }]);

      // Fire-and-forget persistence
      void (async () => {
        const rid = await ensureRoom();
        if (!rid) return;
        api.sendChatMessage({ roomId: rid, clerkId, content: text, role: 'user' }).catch(() => undefined);
        api.sendChatMessage({ roomId: rid, clerkId, content: result.reply, role: 'assistant' }).catch(() => undefined);
      })();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content:
            err instanceof Error && err.message.includes('Too many')
              ? 'You’re sending messages a little fast — give me a few seconds and try again.'
              : 'I couldn’t reach my thoughts just now. Please try that once more.',
          time: now(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="gradient-hero relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <Aurora variant="subtle" />
      <div className="container relative mx-auto flex max-w-3xl flex-1 flex-col px-4 py-6 lg:px-6">
        <div className="mb-4 text-center">
          <h1 className="font-display text-2xl text-foreground">Talk to Manas</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Private and judgment-free · Manas is an AI companion, not a therapist
          </p>
        </div>

        <AnimatePresence>{crisis && <CrisisBanner />}</AnimatePresence>

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto pb-4" role="log" aria-label="Conversation">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {thinking && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {quickPrompts.slice(0, 4).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur-md transition-colors hover:border-sage hover:text-foreground"
              >
                <Sparkles className="h-3 w-3 text-sage" /> {p}
              </button>
            ))}
          </div>
        )}

        <Composer disabled={thinking} onSend={send} />
      </div>
    </div>
  );
}
