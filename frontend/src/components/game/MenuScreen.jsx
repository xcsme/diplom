import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Save, TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export default function MenuScreen({ gameState, gameData, onSetPrices, onToggleMenuItem, loading }) {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    if (gameState) {
      setPrices({ ...gameState.menu_prices });
    }
  }, [gameState]);

  if (!gameState || !gameData) return null;

  const { menu_available, menu_prices } = gameState;
  const { menu_items } = gameData;

  const handleSavePrices = () => {
    const changed = {};
    for (const [id, price] of Object.entries(prices)) {
      if (price !== menu_prices[id]) {
        changed[id] = parseFloat(price) || 0;
      }
    }
    if (Object.keys(changed).length > 0) {
      onSetPrices(changed);
    }
  };

  const hasChanges = Object.entries(prices).some(
    ([id, price]) => parseFloat(price) !== menu_prices[id]
  );

  return (
    <div className="p-5 h-full flex flex-col animate-fadeIn" data-testid="menu-screen">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--coffee-secondary)' }}
          >
            Меню и цены
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--coffee-text-muted)' }}>
            Установите цены и управляйте доступностью позиций
          </p>
        </div>
        {hasChanges && (
          <Button
            data-testid="save-prices-btn"
            onClick={handleSavePrices}
            disabled={loading}
            className="rounded-xl font-semibold"
            style={{ background: 'var(--coffee-primary)', color: '#FDFBF7' }}
          >
            <Save size={16} className="mr-2" />
            Сохранить цены
          </Button>
        )}
      </div>

      <div className="space-y-3 flex-1 overflow-auto">
        {menu_items.map((item) => {
          const isAvailable = menu_available[item.id];
          const currentPrice = parseFloat(prices[item.id]) || 0;
          const cost = item.cost || 0;
          const profit = currentPrice - cost;
          const margin = cost > 0 ? ((profit / cost) * 100).toFixed(0) : 0;
          const isProfitable = profit > 0;

          // Recipe display
          const recipeText = Object.entries(item.recipe || {})
            .map(([ingId, qty]) => {
              const ing = gameData.ingredients.find((i) => i.id === ingId);
              return ing ? `${ing.name}: ${qty}` : '';
            })
            .filter(Boolean)
            .join(', ');

          return (
            <div
              key={item.id}
              className="rounded-xl p-4 transition-all"
              style={{
                background: isAvailable ? 'var(--coffee-surface)' : 'var(--coffee-cream)',
                border: `1px solid ${isAvailable ? 'var(--coffee-border)' : 'var(--coffee-cream)'}`,
                opacity: isAvailable ? 1 : 0.7,
              }}
              data-testid={`menu-item-${item.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold" style={{ color: 'var(--coffee-text)' }}>
                      {item.name}
                    </h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: 'var(--coffee-border)', color: 'var(--coffee-text-muted)' }}
                          >
                            Попул. {(item.popularity * 100).toFixed(0)}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Базовая популярность позиции</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--coffee-text-muted)' }}>
                    Состав: {recipeText}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs" style={{ color: 'var(--coffee-text-muted)' }}>
                      Себестоимость: <strong>{cost.toFixed(0)} ₽</strong>
                    </span>
                    <span
                      className="text-xs flex items-center gap-1"
                      style={{ color: isProfitable ? 'var(--coffee-success)' : 'var(--coffee-danger)' }}
                    >
                      {isProfitable ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      Прибыль: {profit.toFixed(0)} ₽ ({margin}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--coffee-text-muted)' }}>
                      Цена
                    </label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={prices[item.id] || ''}
                        onChange={(e) => setPrices({ ...prices, [item.id]: e.target.value })}
                        className="h-9 w-24 text-center text-sm font-semibold"
                        min={0}
                        step={10}
                        style={{
                          background: 'var(--coffee-cream)',
                          border: '1px solid var(--coffee-border)',
                          color: 'var(--coffee-text)',
                        }}
                        data-testid={`price-input-${item.id}`}
                      />
                      <span className="text-sm" style={{ color: 'var(--coffee-text-muted)' }}>₽</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--coffee-text-muted)' }}>
                      Активно
                    </label>
                    <Switch
                      checked={isAvailable}
                      onCheckedChange={(checked) => onToggleMenuItem(item.id, checked)}
                      data-testid={`toggle-${item.id}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
