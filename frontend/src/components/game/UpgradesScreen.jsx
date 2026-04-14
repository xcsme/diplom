import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Lock, Check, Zap, Users, Megaphone, Wrench } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const TYPE_ICONS = {
  equipment: Wrench,
  staff: Users,
  marketing: Megaphone,
};

const TYPE_LABELS = {
  equipment: 'Оборудование',
  staff: 'Персонал',
  marketing: 'Маркетинг',
};

const TYPE_COLORS = {
  equipment: { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' },
  staff: { bg: '#E8F5E9', border: '#4CAF50', text: '#1B5E20' },
  marketing: { bg: '#E3F2FD', border: '#2196F3', text: '#0D47A1' },
};

export default function UpgradesScreen({ gameState, gameData, onBuyUpgrade, loading }) {
  if (!gameState || !gameData) return null;

  const { money, purchased_upgrades } = gameState;
  const { upgrades } = gameData;

  const groupedUpgrades = {
    equipment: upgrades.filter((u) => u.type === 'equipment'),
    staff: upgrades.filter((u) => u.type === 'staff'),
    marketing: upgrades.filter((u) => u.type === 'marketing'),
  };

  return (
    <div className="p-5 h-full flex flex-col animate-fadeIn" data-testid="upgrades-screen">
      <div className="mb-4">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', serif", color: 'var(--coffee-secondary)' }}
        >
          Улучшения
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--coffee-text-muted)' }}>
          Развивайте кофейню: оборудование, персонал и маркетинг
        </p>
      </div>

      <div className="flex-1 overflow-auto space-y-5">
        {Object.entries(groupedUpgrades).map(([type, items]) => {
          const Icon = TYPE_ICONS[type];
          const colors = TYPE_COLORS[type];

          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={18} color={colors.text} />
                <h3 className="font-semibold text-sm" style={{ color: colors.text }}>
                  {TYPE_LABELS[type]}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {items.map((upgrade) => {
                  const isPurchased = purchased_upgrades.includes(upgrade.id);
                  const reqMet = !upgrade.required_upgrade_id ||
                    purchased_upgrades.includes(upgrade.required_upgrade_id);
                  const canAfford = money >= upgrade.cost;
                  const isAvailable = !isPurchased && reqMet;

                  return (
                    <TooltipProvider key={upgrade.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`upgrade-node ${isPurchased ? 'purchased' : isAvailable ? 'available' : 'locked'}`}
                            onClick={() => {
                              if (isAvailable && canAfford && !loading) {
                                onBuyUpgrade(upgrade.id);
                              }
                            }}
                            data-testid={`upgrade-${upgrade.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm" style={{ color: 'var(--coffee-text)' }}>
                                {upgrade.name}
                              </h4>
                              {isPurchased ? (
                                <Check size={16} color="var(--coffee-success)" />
                              ) : !reqMet ? (
                                <Lock size={16} color="var(--coffee-text-muted)" />
                              ) : (
                                <Zap size={16} color="var(--coffee-accent)" />
                              )}
                            </div>
                            <p className="text-xs mb-3" style={{ color: 'var(--coffee-text-muted)' }}>
                              {upgrade.description}
                            </p>
                            {!isPurchased && (
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold"
                                  style={{
                                    borderColor: canAfford ? 'var(--coffee-success)' : 'var(--coffee-danger)',
                                    color: canAfford ? 'var(--coffee-success)' : 'var(--coffee-danger)',
                                  }}
                                >
                                  {upgrade.cost.toLocaleString('ru-RU')} ₽
                                </Badge>
                                {isAvailable && canAfford && (
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs rounded-lg"
                                    style={{ background: 'var(--coffee-primary)', color: '#FDFBF7' }}
                                    disabled={loading}
                                    data-testid={`buy-upgrade-${upgrade.id}`}
                                  >
                                    Купить
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isPurchased ? (
                            <p>Уже куплено</p>
                          ) : !reqMet ? (
                            <p>Сначала купите: {upgrades.find(u => u.id === upgrade.required_upgrade_id)?.name}</p>
                          ) : !canAfford ? (
                            <p>Не хватает {(upgrade.cost - money).toLocaleString('ru-RU')} ₽</p>
                          ) : (
                            <p>Нажмите, чтобы купить</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
