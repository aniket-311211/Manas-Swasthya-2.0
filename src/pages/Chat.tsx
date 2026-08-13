import { useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { Sparkles, Trash2 } from 'lucide-react';
import Silk from '@/components/Silk/Silk';
import { aiChat } from '@/lib/ai';
import { api } from '@/lib/api';
import { calcStreak } from '@/lib/streak';
import { detectCrisis } from '@/lib/crisis';
import { moodLabel, sortByCreatedAt } from '@/components/dashboard/moodInsights';
import { resolutionOf, todaysIntention } from '@/components/dashboard/ritual';
import CrisisBanner from '@/features/chat/CrisisBanner';
import Composer from '@/features/chat/Composer';
import MessageBubble, { TypingIndicator, type UiMessage } from '@/features/chat/MessageBubble';

const now = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const FOCUS_LIGHT = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80';
const MAX_STORED_MESSAGES = 50;

export default function Chat() {
  const { t } = useTranslation();
  const { user } = useUser();
  const clerkId = user?.id ?? '';
  const enabled = !!clerkId;
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hydratedRoomsRef = useRef<string | null>(null);
  const reduceMotion = useReducedMotion();

  // Same query keys as the dashboard, so this reuses the cache rather than refetching.
  const { data: moods = [] } = useQuery({
    queryKey: ['mood', clerkId],
    queryFn: () => api.getMoodHistory(clerkId),
    enabled,
  });
  const { data: journals = [] } = useQuery({
    queryKey: ['journal', clerkId],
    queryFn: () => api.getJournal(clerkId),
    enabled,
  });
  const {
    data: chatRooms = [],
    isLoading: chatRoomsLoading,
    refetch: refetchChatRooms,
  } = useQuery({
    queryKey: ['chat-rooms', clerkId, 'ai_chat'],
    queryFn: () => api.getChatRooms({ clerkId, type: 'ai_chat' }),
    enabled,
  });

  const existingRoom = chatRooms.find((room) => room.type === 'ai_chat');
  const chatRoomKey = chatRooms.map((room) => room.id).join(',');

  const { data: persistedMessages = [], isLoading: persistedLoading } = useQuery({
    queryKey: ['chat-messages', clerkId, chatRoomKey],
    queryFn: async () => {
      const messageGroups = await Promise.all(
        chatRooms.map((room) => api.getChatMessages(room.id, { limit: 200, clerkId })),
      );
      return messageGroups
        .flat()
        .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    },
    enabled: enabled && chatRooms.length > 0,
  });

  const context = useMemo(() => {
    const latest = sortByCreatedAt(moods).at(-1);
    const sameDay = latest && new Date(latest.createdAt).toDateString() === new Date().toDateString();
    const intention = todaysIntention(journals);
    return {
      mood: sameDay ? moodLabel(latest.mood) : undefined,
      intention: intention && !resolutionOf(intention) ? intention.content : undefined,
      streak: calcStreak(moods.map((m) => m.createdAt)) || undefined,
    };
  }, [moods, journals]);

  const quickPromptsRaw = t('chat.quickPrompts', { returnObjects: true });
  const quickPrompts = Array.isArray(quickPromptsRaw)
    ? (quickPromptsRaw as string[])
    : ['Exam stress is getting to me', 'I feel lonely at college', 'I can’t sleep properly', 'How do I stop overthinking?'];

  // An opener that references today, when there is a today to reference.
  const opener = context.intention
    ? `Hi, I’m Manas. This morning you wanted to ${context.intention.replace(/\.$/, '')} — how is that going?`
    : context.mood
      ? `Hi, I’m Manas. You checked in as ${context.mood.toLowerCase()} today. Want to talk about it?`
      : t('chat.intro', 'Hi, I’m Manas. This is your private, judgment-free space. What’s on your mind today?');

  useEffect(() => {
    if (existingRoom && existingRoom.id !== roomId) setRoomId(existingRoom.id);
  }, [existingRoom, roomId]);

  useEffect(() => {
    setRoomId(null);
    hydratedRoomsRef.current = null;
    setMessages([]);
  }, [clerkId]);

  useEffect(() => {
    if (!chatRoomKey || persistedLoading || hydratedRoomsRef.current === chatRoomKey) return;
    hydratedRoomsRef.current = chatRoomKey;
    const restored = persistedMessages
      // A plain boolean filter does not narrow the union, so `'system'` would
      // still be typed through into UiMessage. The predicate does narrow it.
      .filter((message): message is typeof message & { role: 'user' | 'assistant' } =>
        message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        time: new Date(message.timestamp).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
    if (restored.length > 0) setMessages(restored);
  }, [chatRoomKey, persistedLoading, persistedMessages]);

  useEffect(() => {
    setMessages((prev) => {
      // Async context can update after the user has started chatting; only
      // refresh the untouched opener, never an active conversation.
      if (prev.length > 1 || (prev.length === 1 && prev[0].id !== 'intro')) return prev;
      return [{ id: 'intro', role: 'assistant', content: opener, time: now() }];
    });
  }, [opener]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const ensureRoom = async (): Promise<string | null> => {
    if (roomId) return roomId;
    const rooms = chatRoomsLoading ? (await refetchChatRooms()).data ?? [] : chatRooms;
    const existing = rooms.find((room) => room.type === 'ai_chat');
    if (existing) {
      setRoomId(existing.id);
      return existing.id;
    }
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
      const result = await aiChat(clerkId, history, localStorage.getItem('app_lang') ?? 'en', context);
      if (result.crisis) setCrisis(true);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: result.reply, time: now() }]);

      void (async () => {
        const rid = await ensureRoom();
        if (!rid) return;
        await Promise.all([
          api.sendChatMessage({ roomId: rid, clerkId, content: text, role: 'user' }),
          api.sendChatMessage({ roomId: rid, clerkId, content: result.reply, role: 'assistant' }),
        ]);
        if (MAX_STORED_MESSAGES > 0) await api.pruneChatMessages(rid, clerkId);
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

  const startFresh = async () => {
    if (clearing || !window.confirm('Delete this chat history and start fresh?')) return;
    setClearing(true);
    try {
      if (chatRooms.length > 0) {
        await Promise.all(chatRooms.map((room) => api.clearChatMessages(room.id, clerkId)));
        queryClient.setQueryData(['chat-messages', clerkId, chatRoomKey], []);
      }
      hydratedRoomsRef.current = chatRoomKey;
      setCrisis(false);
      setMessages([{ id: 'intro', role: 'assistant', content: opener, time: now() }]);
    } catch {
      // Keep the conversation visible if the server could not clear it.
    } finally {
      setClearing(false);
    }
  };

  const empty = messages.length <= 1;

  return (
    <div className="relative flex min-h-[calc(100vh-4.25rem)] flex-col">
      {/*
        Silk canvas. `fixed` so it spans the viewport under the sticky top bar;
        pointer-events-none so it never eats a click on the composer.
        Reduced motion falls back to the flat colour rather than an animation
        nobody asked for — same hex, so contrast is identical either way.
      */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[#3b5f78]">
        {!reduceMotion && <Silk speed={3.5} scale={1.2} color="#3b5f78" noiseIntensity={1.9} rotation={0} />}
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 pt-8 lg:px-6">
        <AnimatePresence>{crisis && <CrisisBanner />}</AnimatePresence>

        {empty ? (
          // Opening state: Manas front and centre, no chrome.
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="relative flex items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute h-36 w-36 rounded-full bg-[#9DA9C7]/20 blur-2xl motion-safe:animate-[manasBreathe_4s_ease-in-out_infinite]"
              />
              <img
                src="/logos/manas_swasthya_logo_white.png"
                alt="Manas Swasthya logo"
                className="relative z-10 w-36 max-w-[46vw] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
              />
            </div>
            <h1 className="mt-6 font-display text-[34px] leading-tight text-white">Talk to Manas</h1>
            <p className="mt-2 max-w-md text-[15px] text-[#D6DEE8]">{opener}</p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
              Private · not a therapist
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {quickPrompts.slice(0, 4).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className={`inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3.5 py-2 text-[13px] text-white/90 backdrop-blur-xl transition-colors hover:bg-white/25 ${FOCUS_LIGHT}`}
                >
                  <Sparkles className="h-3 w-3 text-white/70" aria-hidden="true" /> {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-4" role="log" aria-label="Conversation">
              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}
              {thinking && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        <div className="sticky bottom-0 pt-3">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Composer disabled={thinking} onSend={send} />
            </div>
            {!empty && (
              <button
                type="button"
                onClick={() => void startFresh()}
                disabled={clearing || thinking}
                aria-label="Start a fresh chat"
                className={`inline-flex h-[60px] shrink-0 items-center gap-1.5 rounded-[22px] border border-white/25 bg-white/10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80 backdrop-blur-xl transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_LIGHT}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{clearing ? 'Clearing…' : 'Start fresh'}</span>
              </button>
            )}
          </div>
          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
            Manas is an AI companion, not a substitute for professional care
          </p>
        </div>
      </div>
    </div>
  );
}
