import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Users, Coins, Star, Zap } from 'lucide-react';

export default function DailyReport({ report, onClose, gameData }) {
  if (!report) return null;

  const isProfitable = report.profit > 0;
  const repUp = report.rep_change > 0;

  // Get menu item names for orders
  const orderNames = gameData?.menu_items
    ? Object.entries(report.orders || {}).map(([id, qty]) => {
        const item = gameData.menu_items.find((m) => m.id === id);
        return item ? `${item.name}: ${qty}` : `${id}: ${qty}`;
      })
    : [];

  return (
    <Dialog open={!!report} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md rounded-2xl"
        style={{
          background: 'var(--coffee-bg)',
          border: '1px solid var(--coffee-border)',
        }}
        data-testid="daily-report-modal"
      >
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold text-center"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--coffee-secondary)' }}
          >
            Итоги дня {report.day}
          </DialogTitle>
          <DialogDescription className="sr-only">Отчёт о результатах рабочего дня</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Events */}
          {report.events && report.events.length > 0 && (
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(249, 168, 37, 0.1)', border: '1px solid rgba(249, 168, 37, 0.3)' }}
            >
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--coffee-warning)' }}>
                <Zap size={14} />
                События дня
              </h4>
              {report.events.map((event, i) => (
                <p key={i} className="text-sm mb-1" style={{ color: 'var(--coffee-text)' }}>
                  <strong>{event.name}:</strong> {event.description}
                </p>
              ))}
            </div>
          )}

          {/* Visitors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--coffee-cream)' }}>
              <Users size={20} className="mx-auto mb-1" style={{ color: 'var(--coffee-primary)' }} />
              <p className="text-xs" style={{ color: 'var(--coffee-text-muted)' }}>Посетители</p>
              <p className="text-lg font-bold" style={{ color: 'var(--coffee-text)' }} data-testid="report-visitors">
                {report.visitors}
              </p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--coffee-cream)' }}>
              <Users size={20} className="mx-auto mb-1" style={{ color: 'var(--coffee-success)' }} />
              <p className="text-xs" style={{ color: 'var(--coffee-text-muted)' }}>Обслужено</p>
              <p className="text-lg font-bold" style={{ color: 'var(--coffee-text)' }} data-testid="report-served">
                {report.served}
              </p>
            </div>
          </div>

          {/* Financial */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--coffee-surface)', border: '1px solid var(--coffee-border)' }}
          >
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--coffee-text-secondary)' }}>Выручка</span>
                <span className="font-semibold" style={{ color: 'var(--coffee-success)' }} data-testid="report-revenue">
                  +{report.revenue.toFixed(0)} ₽
                </span>
              </div>
              {report.expenses > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--coffee-text-secondary)' }}>Расходы (автозакуп)</span>
                  <span className="font-semibold" style={{ color: 'var(--coffee-danger)' }}>
                    -{report.expenses.toFixed(0)} ₽
                  </span>
                </div>
              )}
              <div className="border-t pt-2" style={{ borderColor: 'var(--coffee-border)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold" style={{ color: 'var(--coffee-text)' }}>Прибыль</span>
                  <span
                    className="font-bold text-lg flex items-center gap-1"
                    style={{ color: isProfitable ? 'var(--coffee-success)' : 'var(--coffee-danger)' }}
                    data-testid="report-profit"
                  >
                    {isProfitable ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {report.profit >= 0 ? '+' : ''}{report.profit.toFixed(0)} ₽
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reputation & Satisfaction */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--coffee-cream)' }}>
              <Star size={20} className="mx-auto mb-1" style={{ color: 'var(--coffee-warning)' }} />
              <p className="text-xs" style={{ color: 'var(--coffee-text-muted)' }}>Репутация</p>
              <p
                className="text-lg font-bold flex items-center justify-center gap-1"
                style={{ color: repUp ? 'var(--coffee-success)' : 'var(--coffee-danger)' }}
                data-testid="report-reputation"
              >
                {report.new_reputation}
                <span className="text-xs">({repUp ? '+' : ''}{report.rep_change})</span>
              </p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--coffee-cream)' }}>
              <Coins size={20} className="mx-auto mb-1" style={{ color: 'var(--coffee-primary)' }} />
              <p className="text-xs" style={{ color: 'var(--coffee-text-muted)' }}>Баланс</p>
              <p className="text-lg font-bold" style={{ color: 'var(--coffee-text)' }} data-testid="report-balance">
                {report.new_money.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>

          {/* Orders breakdown */}
          {orderNames.length > 0 && (
            <div className="text-xs" style={{ color: 'var(--coffee-text-muted)' }}>
              <p className="font-semibold mb-1">Заказы:</p>
              <p>{orderNames.join(' | ')}</p>
            </div>
          )}

          <Button
            onClick={onClose}
            className="w-full h-10 rounded-xl font-semibold"
            style={{ background: 'var(--coffee-primary)', color: '#FDFBF7' }}
            data-testid="close-report-btn"
          >
            Продолжить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
