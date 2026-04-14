import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Package, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export default function WarehouseScreen({ gameState, gameData, onBuyIngredients, loading }) {
  const [quantities, setQuantities] = useState({});

  if (!gameState || !gameData) return null;

  const { inventory, money, purchased_upgrades } = gameState;
  const { ingredients } = gameData;

  const capacityMult = purchased_upgrades.includes('fridge_3') ? 2.0 :
    purchased_upgrades.includes('fridge_2') ? 1.5 : 1.0;
  const maxStock = Math.floor(100 * capacityMult);

  const getQty = (id) => quantities[id] || 0;
  const setQty = (id, val) => {
    const maxBuy = maxStock - (inventory[id] || 0);
    setQuantities({ ...quantities, [id]: Math.max(0, Math.min(val, maxBuy)) });
  };

  const totalCost = ingredients.reduce((sum, ing) => {
    return sum + (getQty(ing.id) * ing.base_price);
  }, 0);

  const handleBuy = () => {
    const purchases = {};
    for (const ing of ingredients) {
      const q = getQty(ing.id);
      if (q > 0) purchases[ing.id] = q;
    }
    if (Object.keys(purchases).length > 0) {
      onBuyIngredients(purchases);
      setQuantities({});
    }
  };

  return (
    <div className="p-5 h-full flex flex-col animate-fadeIn" data-testid="warehouse-screen">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--coffee-secondary)' }}
          >
            Склад и закупки
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--coffee-text-muted)' }}>
            Макс. вместимость: {maxStock} ед. каждого ингредиента
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: 'var(--coffee-text-secondary)' }}>
            Итого: <span style={{ color: 'var(--coffee-accent)' }}>{totalCost.toFixed(0)} ₽</span>
          </span>
          <Button
            data-testid="buy-ingredients-btn"
            onClick={handleBuy}
            disabled={loading || totalCost === 0 || totalCost > money}
            className="rounded-xl font-semibold"
            style={{ background: 'var(--coffee-primary)', color: '#FDFBF7' }}
          >
            <ShoppingCart size={16} className="mr-2" />
            Купить
          </Button>
        </div>
      </div>

      {totalCost > money && (
        <div
          className="mb-3 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'rgba(198,40,40,0.08)', color: 'var(--coffee-danger)' }}
        >
          Недостаточно средств! Не хватает {(totalCost - money).toFixed(0)} ₽
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 flex-1 overflow-auto">
        {ingredients.map((ing) => {
          const currentQty = inventory[ing.id] || 0;
          const buyQty = getQty(ing.id);
          const maxBuy = maxStock - currentQty;
          const isFull = currentQty >= maxStock;

          return (
            <div key={ing.id} className="ingredient-card" data-testid={`ingredient-${ing.id}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--coffee-text)' }}>
                    {ing.name}
                  </h4>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--coffee-text-muted)' }}>
                    {ing.base_price} ₽ / {ing.unit}
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={currentQty < 5 ? "destructive" : "secondary"}
                        className="font-semibold"
                      >
                        {currentQty} / {maxStock}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>На складе: {currentQty} {ing.unit} из {maxStock}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Полоса запасов */}
              <div className="w-full h-2 rounded-full mb-3" style={{ background: 'var(--coffee-cream)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(currentQty / maxStock) * 100}%`,
                    background: currentQty < 5 ? 'var(--coffee-danger)' :
                      currentQty < 15 ? 'var(--coffee-warning)' : 'var(--coffee-success)',
                  }}
                />
              </div>

              {!isFull ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setQty(ing.id, buyQty - 5)}
                    disabled={buyQty <= 0}
                    style={{ borderColor: 'var(--coffee-border)' }}
                    data-testid={`minus-${ing.id}`}
                  >
                    <Minus size={14} />
                  </Button>
                  <Input
                    type="number"
                    value={buyQty}
                    onChange={(e) => setQty(ing.id, parseInt(e.target.value) || 0)}
                    className="h-8 text-center text-sm font-medium w-16"
                    min={0}
                    max={maxBuy}
                    style={{ background: 'var(--coffee-cream)', border: '1px solid var(--coffee-border)' }}
                    data-testid={`qty-input-${ing.id}`}
                  />
                  <Button
                    variant="outline" size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setQty(ing.id, buyQty + 5)}
                    disabled={buyQty >= maxBuy}
                    style={{ borderColor: 'var(--coffee-border)' }}
                    data-testid={`plus-${ing.id}`}
                  >
                    <Plus size={14} />
                  </Button>
                  <span className="text-xs ml-1" style={{ color: 'var(--coffee-text-muted)' }}>
                    = {(buyQty * ing.base_price).toFixed(0)} ₽
                  </span>
                </div>
              ) : (
                <p className="text-xs text-center" style={{ color: 'var(--coffee-success)' }}>
                  Склад полон
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
