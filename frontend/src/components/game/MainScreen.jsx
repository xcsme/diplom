import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Users, PlayCircle, Coffee, Package, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export default function MainScreen({ gameState, gameData, onPlayDay, loading }) {
  if (!gameState || !gameData) return null;

  const { inventory, menu_available, menu_prices, reputation, purchased_upgrades } = gameState;
  const { menu_items, ingredients } = gameData;

  // Check low stock warnings
  const lowStock = ingredients.filter((ing) => (inventory[ing.id] || 0) < 5);
  const activeMenu = menu_items.filter((m) => menu_available[m.id]);

  return (
    <div className="p-5 h-full flex flex-col animate-fadeIn" data-testid="main-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--coffee-secondary)' }}
          >
            Рабочий день
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--coffee-text-muted)' }}>
            Подготовьте кофейню и начните новый день
          </p>
        </div>
        <Button
          data-testid="start-day-btn"
          onClick={onPlayDay}
          disabled={loading}
          className="h-12 px-8 text-base font-semibold rounded-xl transition-all"
          style={{
            background: 'var(--coffee-primary)',
            color: '#FDFBF7',
          }}
        >
          <PlayCircle size={20} className="mr-2" />
          {loading ? 'Симуляция...' : 'Начать день'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-5 flex-1">
        {/* Active Menu */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--coffee-surface)', border: '1px solid var(--coffee-border)' }}
        >
          <h3
            className="text-base font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--coffee-secondary)' }}
          >
            <Coffee size={16} />
            Активное меню
          </h3>
          <div className="space-y-2">
            {activeMenu.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--coffee-text-muted)' }}>
                Нет активных позиций. Включите позиции во вкладке «Меню».
              </p>
            ) : (
              activeMenu.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: 'var(--coffee-cream)' }}
                  data-testid={`active-menu-${item.id}`}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--coffee-text)' }}>
                    {item.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--coffee-text-muted)' }}>
                      себест. {item.cost?.toFixed(0)} ₽
                    </span>
                    <Badge
                      variant="secondary"
                      className="font-semibold"
                      style={{ background: 'var(--coffee-primary)', color: '#FDFBF7' }}
                    >
                      {(menu_prices[item.id] || item.base_price).toFixed(0)} ₽
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock Overview */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--coffee-surface)', border: '1px solid var(--coffee-border)' }}
        >
          <h3
            className="text-base font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--coffee-secondary)' }}
          >
            <Package size={16} />
            Запасы на складе
          </h3>
          <div className="space-y-2">
            {ingredients.map((ing) => {
              const qty = inventory[ing.id] || 0;
              const isLow = qty < 5;
              return (
                <div
                  key={ing.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{
                    background: isLow ? 'rgba(198, 40, 40, 0.05)' : 'var(--coffee-cream)',
                    border: isLow ? '1px solid rgba(198, 40, 40, 0.2)' : '1px solid transparent',
                  }}
                  data-testid={`stock-${ing.id}`}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--coffee-text)' }}>
                    {ing.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {isLow && <AlertTriangle size={14} color="var(--coffee-danger)" />}
                    <span
                      className="text-sm font-semibold"
                      style={{ color: isLow ? 'var(--coffee-danger)' : 'var(--coffee-text-secondary)' }}
                    >
                      {qty} {ing.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Cards */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--coffee-surface)', border: '1px solid var(--coffee-border)' }}
        >
          <h3
            className="text-base font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--coffee-secondary)' }}
          >
            <Users size={16} />
            Прогноз посещаемости
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--coffee-text-secondary)' }}>
                Базовый поток
              </span>
              <span className="font-semibold" style={{ color: 'var(--coffee-text)' }}>
                ~{Math.max(5, Math.floor(reputation / 15))} чел.
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--coffee-text-secondary)' }}>
                Вместимость обслуживания
              </span>
              <span className="font-semibold" style={{ color: 'var(--coffee-text)' }}>
                {(() => {
                  let speed = 1.0;
                  if (purchased_upgrades.includes('coffee_machine_3')) speed = 1.5;
                  else if (purchased_upgrades.includes('coffee_machine_2')) speed = 1.3;
                  return Math.floor(20 * speed);
                })()} чел./день
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--coffee-text-secondary)' }}>
                Позиций в меню
              </span>
              <span className="font-semibold" style={{ color: 'var(--coffee-text)' }}>
                {activeMenu.length}
              </span>
            </div>
          </div>
        </div>

        {/* Warnings */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--coffee-surface)', border: '1px solid var(--coffee-border)' }}
        >
          <h3
            className="text-base font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--coffee-secondary)' }}
          >
            <AlertTriangle size={16} />
            Предупреждения
          </h3>
          {lowStock.length === 0 && activeMenu.length > 0 ? (
            <p className="text-sm" style={{ color: 'var(--coffee-success)' }}>
              Всё в порядке! Кофейня готова к работе.
            </p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((ing) => (
                <p key={ing.id} className="text-sm" style={{ color: 'var(--coffee-danger)' }}>
                  Мало запасов: {ing.name} ({inventory[ing.id] || 0} {ing.unit})
                </p>
              ))}
              {activeMenu.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--coffee-danger)' }}>
                  Нет позиций в меню! Включите хотя бы одну.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
