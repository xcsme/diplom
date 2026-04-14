import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Trophy, Frown, RotateCcw } from 'lucide-react';

export default function GameOverModal({ status, gameState, onNewGame }) {
  const isWon = status === 'won';
  const isOpen = status === 'won' || status === 'lost_money' || status === 'lost_reputation';

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="max-w-sm rounded-2xl text-center"
        style={{
          background: 'var(--coffee-bg)',
          border: `2px solid ${isWon ? 'var(--coffee-success)' : 'var(--coffee-danger)'}`,
        }}
        data-testid="game-over-modal"
      >
        <DialogHeader>
          <DialogTitle
            className="text-2xl font-bold text-center"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: isWon ? 'var(--coffee-success)' : 'var(--coffee-danger)',
            }}
          >
            {isWon ? 'Победа!' : 'Игра окончена'}
          </DialogTitle>
          <DialogDescription className="sr-only">Результат игры</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              background: isWon
                ? 'linear-gradient(135deg, #C8E6C9, #81C784)'
                : 'linear-gradient(135deg, #FFCDD2, #EF9A9A)',
            }}
          >
            {isWon ? (
              <Trophy size={40} color="#1B5E20" />
            ) : (
              <Frown size={40} color="#B71C1C" />
            )}
          </div>

          {isWon ? (
            <>
              <p className="text-base mb-2" style={{ color: 'var(--coffee-text)' }}>
                Поздравляем, {gameState?.player_name}!
              </p>
              <p className="text-sm mb-1" style={{ color: 'var(--coffee-text-secondary)' }}>
                Вы достигли 100 000 ₽ за {gameState?.current_day - 1} дней!
              </p>
              <p className="text-sm" style={{ color: 'var(--coffee-text-muted)' }}>
                Ваша кофейня стала настоящим успехом!
              </p>
            </>
          ) : status === 'lost_money' ? (
            <>
              <p className="text-base mb-2" style={{ color: 'var(--coffee-text)' }}>
                Банкротство!
              </p>
              <p className="text-sm" style={{ color: 'var(--coffee-text-secondary)' }}>
                Ваши деньги закончились на день {gameState?.current_day - 1}.
              </p>
              <p className="text-sm" style={{ color: 'var(--coffee-text-muted)' }}>
                Попробуйте более осторожную стратегию.
              </p>
            </>
          ) : (
            <>
              <p className="text-base mb-2" style={{ color: 'var(--coffee-text)' }}>
                Репутация на нуле!
              </p>
              <p className="text-sm" style={{ color: 'var(--coffee-text-secondary)' }}>
                Клиенты перестали приходить на день {gameState?.current_day - 1}.
              </p>
              <p className="text-sm" style={{ color: 'var(--coffee-text-muted)' }}>
                Следите за качеством и ценами.
              </p>
            </>
          )}

          <Button
            onClick={onNewGame}
            className="mt-6 h-10 px-6 rounded-xl font-semibold"
            style={{ background: 'var(--coffee-primary)', color: '#FDFBF7' }}
            data-testid="restart-game-btn"
          >
            <RotateCcw size={16} className="mr-2" />
            Новая игра
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
