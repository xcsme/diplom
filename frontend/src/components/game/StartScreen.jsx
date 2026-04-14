import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Coffee, Play, FolderOpen, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

export default function StartScreen({ onNewGame, onLoadGame, saves, onDeleteGame, loading }) {
  const [playerName, setPlayerName] = useState('');
  const [showSaves, setShowSaves] = useState(false);

  return (
    <div className="start-screen animate-fadeIn" data-testid="start-screen">
      <div className="mb-8 flex flex-col items-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{
            background: 'linear-gradient(135deg, var(--coffee-primary), var(--coffee-primary-hover))',
            boxShadow: '0 8px 32px rgba(141, 110, 99, 0.4)',
          }}
        >
          <Coffee size={48} color="#FDFBF7" />
        </div>
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "'Playfair Display', serif", color: 'var(--coffee-secondary)' }}
        >
          Кофейня
        </h1>
        <p
          className="text-lg mb-1"
          style={{ fontFamily: "'Playfair Display', serif", color: 'var(--coffee-text-muted)', fontStyle: 'italic' }}
        >
          Мастерская вкуса
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--coffee-text-secondary)' }}>
          Экономический симулятор кофейни
        </p>
      </div>

      {!showSaves ? (
        <div className="flex flex-col items-center gap-4 w-72">
          <Input
            data-testid="player-name-input"
            placeholder="Ваше имя..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="text-center"
            style={{
              background: 'var(--coffee-surface)',
              border: '1px solid var(--coffee-border)',
              color: 'var(--coffee-text)',
            }}
          />
          <Button
            data-testid="new-game-btn"
            onClick={() => onNewGame(playerName || 'Игрок')}
            disabled={loading}
            className="w-full h-12 text-base font-semibold rounded-xl"
            style={{
              background: 'var(--coffee-primary)',
              color: '#FDFBF7',
            }}
          >
            <Play size={18} className="mr-2" />
            Новая игра
          </Button>
          {saves && saves.length > 0 && (
            <Button
              data-testid="show-saves-btn"
              variant="outline"
              onClick={() => setShowSaves(true)}
              className="w-full h-10 rounded-xl"
              style={{
                borderColor: 'var(--coffee-border)',
                color: 'var(--coffee-text-secondary)',
              }}
            >
              <FolderOpen size={16} className="mr-2" />
              Загрузить игру ({saves.length})
            </Button>
          )}
        </div>
      ) : (
        <div className="w-80">
          <h3
            className="text-lg font-semibold mb-3 text-center"
            style={{ color: 'var(--coffee-secondary)' }}
          >
            Сохранённые игры
          </h3>
          <ScrollArea className="h-64 rounded-xl" style={{ border: '1px solid var(--coffee-border)' }}>
            <div className="p-3 space-y-2">
              {saves.map((save) => (
                <div
                  key={save.id}
                  className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:shadow-md"
                  style={{
                    background: 'var(--coffee-surface)',
                    border: '1px solid var(--coffee-border)',
                  }}
                  data-testid={`save-slot-${save.id}`}
                >
                  <div className="flex-1" onClick={() => onLoadGame(save.id)}>
                    <p className="font-medium text-sm" style={{ color: 'var(--coffee-text)' }}>
                      {save.player_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--coffee-text-muted)' }}>
                      День {save.current_day} | {save.money?.toLocaleString('ru-RU')} ₽ | Реп: {save.reputation}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteGame(save.id); }}
                    className="p-1 rounded hover:bg-red-50 transition-colors"
                    data-testid={`delete-save-${save.id}`}
                  >
                    <Trash2 size={14} color="var(--coffee-danger)" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Button
            variant="outline"
            onClick={() => setShowSaves(false)}
            className="w-full mt-3 rounded-xl"
            style={{ borderColor: 'var(--coffee-border)', color: 'var(--coffee-text-secondary)' }}
            data-testid="back-to-start-btn"
          >
            Назад
          </Button>
        </div>
      )}
    </div>
  );
}
