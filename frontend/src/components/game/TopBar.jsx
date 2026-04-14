import { Coins, Star, CalendarDays, Trophy } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export default function TopBar({ money, reputation, day, status }) {
  const winProgress = Math.min(100, (money / 100000) * 100);

  return (
    <div
      data-testid="top-bar"
      className="flex items-center justify-between px-5 py-3"
      style={{ background: 'var(--coffee-latte)', borderBottom: '1px solid var(--coffee-border)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="font-bold text-lg tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: 'var(--coffee-secondary)' }}
        >
          Кофейня
        </span>
      </div>

      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="resource-badge money" data-testid="resource-money">
                <Coins size={16} />
                <span>{money.toLocaleString('ru-RU')} ₽</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ваши деньги. Цель: 100 000 ₽</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="resource-badge reputation" data-testid="resource-reputation">
                <Star size={16} />
                <span>{reputation}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Репутация (0-1000). Влияет на поток посетителей</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="resource-badge day" data-testid="resource-day">
                <CalendarDays size={16} />
                <span>День {day}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Текущий день игры</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-3" data-testid="win-progress">
                <Trophy size={14} style={{ color: 'var(--coffee-accent)' }} />
                <div className="w-24">
                  <Progress value={winProgress} className="h-2" />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--coffee-text-muted)' }}>
                  {winProgress.toFixed(0)}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Прогресс до победы: {money.toLocaleString('ru-RU')} / 100 000 ₽</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
