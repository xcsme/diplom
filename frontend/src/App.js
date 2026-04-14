import { useState, useEffect, useCallback } from 'react';
import '@/App.css';
import axios from 'axios';

import TopBar from '@/components/game/TopBar';
import StartScreen from '@/components/game/StartScreen';
import MainScreen from '@/components/game/MainScreen';
import WarehouseScreen from '@/components/game/WarehouseScreen';
import MenuScreen from '@/components/game/MenuScreen';
import UpgradesScreen from '@/components/game/UpgradesScreen';
import StatsScreen from '@/components/game/StatsScreen';
import AchievementsScreen from '@/components/game/AchievementsScreen';
import DailyReport from '@/components/game/DailyReport';
import GameOverModal from '@/components/game/GameOverModal';

import { Toaster, toast } from 'sonner';
import {
  PlayCircle, Package, UtensilsCrossed, Wrench, BarChart3, Award
} from 'lucide-react';
import {
  initAudio, setMuted, getMuted, startAmbient, stopAmbient,
  playClick, playCoin, playSpend, playSuccess, playError,
  playEvent, playDayStart, playDayEnd, playWin, playLose, playUpgrade
} from '@/utils/SoundManager';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TABS = [
  { id: 'main', label: 'Играть', icon: PlayCircle },
  { id: 'warehouse', label: 'Склад', icon: Package },
  { id: 'menu', label: 'Меню', icon: UtensilsCrossed },
  { id: 'upgrades', label: 'Улучшения', icon: Wrench },
  { id: 'achievements', label: 'Достижения', icon: Award },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
];

function App() {
  const [gameState, setGameState] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [saves, setSaves] = useState([]);
  const [activeTab, setActiveTab] = useState('main');
  const [dailyReport, setDailyReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const handleToggleSound = useCallback(() => {
    const newVal = !soundOn;
    setSoundOn(newVal);
    setMuted(!newVal);
  }, [soundOn]);

  const showAchievementToasts = useCallback((newAchs) => {
    if (!newAchs || newAchs.length === 0 || !gameData) return;
    const achList = gameData.achievements || [];
    newAchs.forEach((achId, i) => {
      const ach = achList.find(a => a.id === achId);
      if (ach) {
        setTimeout(() => {
          toast.success(`Достижение: ${ach.name}!`, { description: ach.description });
          playUpgrade();
        }, i * 600);
      }
    });
  }, [gameData]);

  const handleExit = useCallback(() => {
    playClick();
    setGameState(null);
    setStarted(false);
    setDailyReport(null);
    setActiveTab('main');
    stopAmbient();
    axios.get(`${API}/game/saves/list`).then((res) => setSaves(res.data)).catch(console.error);
  }, []);

  // Fetch static game data
  useEffect(() => {
    axios.get(`${API}/game/data`).then((res) => setGameData(res.data)).catch(console.error);
    axios.get(`${API}/game/saves/list`).then((res) => setSaves(res.data)).catch(console.error);
  }, []);

  const refreshGameState = useCallback(async (gameId) => {
    try {
      const res = await axios.get(`${API}/game/${gameId}`);
      setGameState(res.data);
    } catch (err) {
      console.error('Failed to refresh game state:', err);
    }
  }, []);

  const handleNewGame = async (playerName) => {
    setLoading(true);
    try {
      initAudio();
      const res = await axios.post(`${API}/game/new`, { player_name: playerName });
      setGameState(res.data);
      setStarted(true);
      setActiveTab('main');
      toast.success('Новая игра начата!');
      playSuccess();
      startAmbient();
    } catch (err) {
      toast.error('Ошибка при создании игры');
      playError();
      console.error(err);
    }
    setLoading(false);
  };

  const handleLoadGame = async (gameId) => {
    setLoading(true);
    try {
      initAudio();
      const res = await axios.get(`${API}/game/${gameId}`);
      setGameState(res.data);
      setStarted(true);
      setActiveTab('main');
      toast.success('Игра загружена!');
      playSuccess();
      startAmbient();
    } catch (err) {
      toast.error('Ошибка при загрузке');
      playError();
      console.error(err);
    }
    setLoading(false);
  };

  const handleDeleteGame = async (gameId) => {
    try {
      await axios.delete(`${API}/game/${gameId}`);
      setSaves((prev) => prev.filter((s) => s.id !== gameId));
      toast.success('Сохранение удалено');
      playClick();
    } catch (err) {
      toast.error('Ошибка при удалении');
      playError();
    }
  };

  const handlePlayDay = async () => {
    if (!gameState) return;
    setLoading(true);
    playDayStart();
    try {
      const res = await axios.post(`${API}/game/${gameState.id}/play-day`);
      const report = res.data.report;
      setDailyReport(report);
      setGameState(res.data.game_state);

      // Show achievement toasts
      if (report.new_achievements && report.new_achievements.length > 0) {
        showAchievementToasts(report.new_achievements);
      }

      // Play sound based on result
      setTimeout(() => {
        if (report.events && report.events.length > 0) playEvent();
        if (report.status === 'won') {
          setTimeout(() => playWin(), 400);
        } else if (report.status === 'lost_money' || report.status === 'lost_reputation') {
          setTimeout(() => playLose(), 400);
        } else {
          playDayEnd();
        }
      }, 300);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка при симуляции дня');
      playError();
      console.error(err);
    }
    setLoading(false);
  };

  const handleBuyIngredients = async (purchases) => {
    if (!gameState) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/game/${gameState.id}/buy-ingredients`, { purchases });
      setGameState((prev) => ({
        ...prev,
        money: res.data.money,
        inventory: res.data.inventory,
      }));
      toast.success(`Закупка: -${res.data.total_cost.toFixed(0)} ₽`);
      playSpend();
      if (res.data.new_achievements?.length > 0) {
        showAchievementToasts(res.data.new_achievements);
        refreshGameState(gameState.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка при закупке');
      playError();
    }
    setLoading(false);
  };

  const handleSetPrices = async (prices) => {
    if (!gameState) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/game/${gameState.id}/set-prices`, { prices });
      setGameState((prev) => ({ ...prev, menu_prices: res.data.menu_prices }));
      toast.success('Цены обновлены');
      playClick();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка');
      playError();
    }
    setLoading(false);
  };

  const handleToggleMenuItem = async (itemId, isAvailable) => {
    if (!gameState) return;
    try {
      const res = await axios.post(`${API}/game/${gameState.id}/toggle-menu-item`, {
        item_id: itemId,
        is_available: isAvailable,
      });
      setGameState((prev) => ({ ...prev, menu_available: res.data.menu_available }));
      playClick();
    } catch (err) {
      toast.error('Ошибка');
      playError();
    }
  };

  const handleBuyUpgrade = async (upgradeId) => {
    if (!gameState) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/game/${gameState.id}/buy-upgrade`, { upgrade_id: upgradeId });
      setGameState((prev) => ({
        ...prev,
        money: res.data.money,
        purchased_upgrades: res.data.purchased_upgrades,
        ...(res.data.reputation !== undefined ? { reputation: res.data.reputation } : {}),
      }));
      const upgrade = gameData?.upgrades?.find((u) => u.id === upgradeId);
      toast.success(`Куплено: ${upgrade?.name || upgradeId}`);
      playUpgrade();
      if (res.data.new_achievements?.length > 0) {
        showAchievementToasts(res.data.new_achievements);
        refreshGameState(gameState.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка при покупке');
      playError();
    }
    setLoading(false);
  };

  const handleRestart = () => {
    setGameState(null);
    setStarted(false);
    setDailyReport(null);
    setActiveTab('main');
    stopAmbient();
    axios.get(`${API}/game/saves/list`).then((res) => setSaves(res.data)).catch(console.error);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'main':
        return (
          <MainScreen
            gameState={gameState}
            gameData={gameData}
            onPlayDay={handlePlayDay}
            loading={loading}
          />
        );
      case 'warehouse':
        return (
          <WarehouseScreen
            gameState={gameState}
            gameData={gameData}
            onBuyIngredients={handleBuyIngredients}
            loading={loading}
          />
        );
      case 'menu':
        return (
          <MenuScreen
            gameState={gameState}
            gameData={gameData}
            onSetPrices={handleSetPrices}
            onToggleMenuItem={handleToggleMenuItem}
            loading={loading}
          />
        );
      case 'upgrades':
        return (
          <UpgradesScreen
            gameState={gameState}
            gameData={gameData}
            onBuyUpgrade={handleBuyUpgrade}
            loading={loading}
          />
        );
      case 'stats':
        return <StatsScreen gameId={gameState?.id} API={API} />;
      case 'achievements':
        return <AchievementsScreen gameState={gameState} gameData={gameData} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#2C1810' }}>
      <Toaster position="top-center" richColors />
      <div className="game-window" data-testid="game-window">
        {!started ? (
          <StartScreen
            onNewGame={handleNewGame}
            onLoadGame={handleLoadGame}
            saves={saves}
            onDeleteGame={handleDeleteGame}
            loading={loading}
          />
        ) : (
          <>
            <TopBar
              money={gameState?.money || 0}
              reputation={gameState?.reputation || 0}
              day={gameState?.current_day || 1}
              status={gameState?.status || 'active'}
              soundOn={soundOn}
              onToggleSound={handleToggleSound}
              onExit={handleExit}
            />

            {/* Tab Navigation */}
            <div className="px-4 pt-2" style={{ background: 'var(--coffee-bg)' }}>
              <div className="tab-nav" data-testid="tab-navigation">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => { setActiveTab(tab.id); playClick(); }}
                      data-testid={`tab-${tab.id}`}
                    >
                      <Icon size={15} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Screen Content */}
            <div className="flex-1 overflow-hidden" style={{ background: 'var(--coffee-bg)' }}>
              {renderScreen()}
            </div>

            {/* Modals */}
            <DailyReport
              report={dailyReport}
              onClose={() => setDailyReport(null)}
              gameData={gameData}
            />
            <GameOverModal
              status={gameState?.status}
              gameState={gameState}
              onNewGame={handleRestart}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
