import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import {
  Sunrise, CalendarCheck, CalendarHeart, Users, HeartHandshake,
  Sparkles, Crown, Banknote, Gem, Award, Trophy, Star, Shield,
  ShoppingCart, TrendingUp, Lock
} from 'lucide-react';

const ICON_MAP = {
  'sunrise': Sunrise,
  'calendar-check': CalendarCheck,
  'calendar-heart': CalendarHeart,
  'users': Users,
  'heart-handshake': HeartHandshake,
  'sparkles': Sparkles,
  'crown': Crown,
  'banknote': Banknote,
  'gem': Gem,
  'award': Award,
  'trophy': Trophy,
  'star': Star,
  'shield': Shield,
  'shopping-cart': ShoppingCart,
  'trending-up': TrendingUp,
};

export default function AchievementsScreen({ gameState, gameData }) {
  if (!gameState || !gameData) return null;

  const allAchievements = gameData.achievements || [];
  const unlocked = new Set(gameState.achievements || []);
  const total = allAchievements.length;
  const unlockedCount = allAchievements.filter(a => unlocked.has(a.id)).length;
  const progressPct = total > 0 ? (unlockedCount / total) * 100 : 0;

  return (
    <div className="p-5 h-full flex flex-col animate-fadeIn" data-testid="achievements-screen">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--coffee-secondary)' }}
          >
            Достижения
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--coffee-text-muted)' }}>
            Открыто {unlockedCount} из {total}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <Progress value={progressPct} className="h-2.5" />
          </div>
          <Badge
            className="text-xs font-bold px-3 py-1"
            style={{
              background: progressPct === 100 ? 'var(--coffee-success)' : 'var(--coffee-primary)',
              color: '#FDFBF7',
            }}
          >
            {progressPct.toFixed(0)}%
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-3 gap-3 pr-3">
          {allAchievements.map((ach) => {
            const isUnlocked = unlocked.has(ach.id);
            const IconComp = ICON_MAP[ach.icon] || Star;

            return (
              <div
                key={ach.id}
                className="rounded-xl p-4 transition-all"
                style={{
                  background: isUnlocked
                    ? 'linear-gradient(135deg, #FFF8E1, #FFECB3)'
                    : 'var(--coffee-surface)',
                  border: `1.5px solid ${isUnlocked ? 'var(--coffee-warning)' : 'var(--coffee-border)'}`,
                  opacity: isUnlocked ? 1 : 0.6,
                }}
                data-testid={`achievement-${ach.id}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: isUnlocked
                        ? 'linear-gradient(135deg, #FFD54F, #FFA726)'
                        : 'var(--coffee-cream)',
                    }}
                  >
                    {isUnlocked ? (
                      <IconComp size={20} color="#5D4037" />
                    ) : (
                      <Lock size={16} color="var(--coffee-text-muted)" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-semibold text-sm leading-tight"
                      style={{ color: isUnlocked ? 'var(--coffee-secondary)' : 'var(--coffee-text-muted)' }}
                    >
                      {ach.name}
                    </h4>
                    <p
                      className="text-xs mt-1 leading-snug"
                      style={{ color: 'var(--coffee-text-muted)' }}
                    >
                      {ach.description}
                    </p>
                    {isUnlocked && (
                      <Badge
                        className="mt-2 text-xs"
                        style={{ background: 'var(--coffee-success)', color: '#fff' }}
                      >
                        Получено
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
