import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { BarChart3, FileText, TrendingUp } from 'lucide-react';

export default function StatsScreen({ gameId, API }) {
  const [stats, setStats] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('charts');

  useEffect(() => {
    if (!gameId) return;
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          fetch(`${API}/game/${gameId}/stats`),
          fetch(`${API}/game/${gameId}/log`),
        ]);
        const statsData = await statsRes.json();
        const logsData = await logsRes.json();
        setStats(statsData);
        setLogs(logsData);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchData();
  }, [gameId, API]);

  const chartData = stats.map((s) => ({
    day: `День ${s.day}`,
    revenue: s.revenue,
    expenses: s.expenses,
    profit: s.profit,
    reputation: s.reputation,
    customers: s.customers_served,
    satisfaction: Math.round(s.avg_satisfaction * 100),
  }));

  return (
    <div className="p-5 h-full flex flex-col animate-fadeIn" data-testid="stats-screen">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--coffee-secondary)' }}
          >
            Статистика
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--coffee-text-muted)' }}>
            Графики и лог событий
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('charts')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'charts' ? 'shadow-sm' : ''}`}
            style={{
              background: tab === 'charts' ? 'var(--coffee-surface)' : 'transparent',
              color: tab === 'charts' ? 'var(--coffee-secondary)' : 'var(--coffee-text-muted)',
              border: tab === 'charts' ? '1px solid var(--coffee-border)' : '1px solid transparent',
            }}
            data-testid="tab-charts"
          >
            <BarChart3 size={14} className="inline mr-1" />
            Графики
          </button>
          <button
            onClick={() => setTab('log')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'log' ? 'shadow-sm' : ''}`}
            style={{
              background: tab === 'log' ? 'var(--coffee-surface)' : 'transparent',
              color: tab === 'log' ? 'var(--coffee-secondary)' : 'var(--coffee-text-muted)',
              border: tab === 'log' ? '1px solid var(--coffee-border)' : '1px solid transparent',
            }}
            data-testid="tab-log"
          >
            <FileText size={14} className="inline mr-1" />
            Лог событий
          </button>
        </div>
      </div>

      {tab === 'charts' ? (
        <div className="flex-1 overflow-auto space-y-4">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: 'var(--coffee-text-muted)' }}>Сыграйте хотя бы один день для отображения статистики</p>
            </div>
          ) : (
            <>
              {/* Revenue Chart */}
              <div className="chart-container" data-testid="revenue-chart">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--coffee-secondary)' }}>
                  <TrendingUp size={14} />
                  Выручка и расходы
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--coffee-border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--coffee-text-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--coffee-text-muted)' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="#8D6E63" name="Выручка" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#D84315" name="Расходы" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reputation Chart */}
              <div className="chart-container" data-testid="reputation-chart">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--coffee-secondary)' }}>
                  <TrendingUp size={14} />
                  Репутация и удовлетворённость
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--coffee-border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--coffee-text-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--coffee-text-muted)' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="reputation" stroke="#F9A825" strokeWidth={2} name="Репутация" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="satisfaction" stroke="#558B2F" strokeWidth={2} name="Удовл. %" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1" data-testid="event-log">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: 'var(--coffee-text-muted)' }}>Нет событий</p>
            </div>
          ) : (
            <div className="space-y-2 pr-3">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--coffee-surface)', border: '1px solid var(--coffee-border)' }}
                >
                  <Badge
                    variant="outline"
                    className="text-xs mt-0.5 shrink-0"
                    style={{ borderColor: 'var(--coffee-border)', color: 'var(--coffee-text-muted)' }}
                  >
                    День {log.day}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--coffee-text)' }}>
                      {log.description}
                    </p>
                    {log.event_type === 'random_event' && (
                      <Badge className="mt-1 text-xs" style={{ background: 'var(--coffee-warning)', color: '#1E130C' }}>
                        Событие
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
