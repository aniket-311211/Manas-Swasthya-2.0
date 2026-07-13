import { useNavigate } from 'react-router-dom';
import { MessageCircleHeart, Brain, NotebookPen, Users } from 'lucide-react';
import GlassCard from '@/components/visual/GlassCard';

const ACTIONS = [
  { icon: MessageCircleHeart, label: 'Talk to Manas', sub: 'AI companion', path: '/chat', color: 'text-sage', bg: 'bg-sage/15' },
  { icon: Brain, label: 'Take assessment', sub: 'Adaptive check-in', path: '/assessment', color: 'text-lavender', bg: 'bg-lavender/15' },
  { icon: NotebookPen, label: 'Write in journal', sub: 'Capture today', path: '/journal', color: 'text-clay', bg: 'bg-clay/15' },
  { icon: Users, label: 'Community', sub: 'Groups and events', path: '/community', color: 'text-sage', bg: 'bg-sage/15' },
];

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {ACTIONS.map((a) => (
        <GlassCard
          key={a.path}
          hoverLift
          className="cursor-pointer p-4"
          onClick={() => navigate(a.path)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate(a.path)}
        >
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bg}`}>
            <a.icon className={`h-5 w-5 ${a.color}`} />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">{a.label}</p>
          <p className="text-xs text-muted-foreground">{a.sub}</p>
        </GlassCard>
      ))}
    </div>
  );
}
