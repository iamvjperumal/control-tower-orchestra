import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../api/client';

interface ReplayEvent {
  event_id: string;
  event_type: string;
  event_time: string;
  source_system: string;
  customer_id: string;
  delay_ms: number;
  metadata: Record<string, unknown>;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  customer_id: string;
  duration_seconds: number;
  event_count: number;
}

const EVENT_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  'order-created': { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', glow: 'rgba(99, 102, 241, 0.3)' },
  'payment-failed': { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', glow: 'rgba(248, 113, 113, 0.3)' },
  'support-ticket-updated': { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)' },
  'shipment-delayed': { bg: 'rgba(192, 132, 252, 0.15)', text: '#c084fc', glow: 'rgba(192, 132, 252, 0.3)' },
  'customer-profile-updated': { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', glow: 'rgba(52, 211, 153, 0.3)' },
  'risk-signal-generated': { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', glow: 'rgba(251, 146, 60, 0.3)' },
  'ai-recommendation-created': { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', glow: 'rgba(139, 92, 246, 0.3)' },
};

const EVENT_ICONS: Record<string, string> = {
  'order-created': 'M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z',
  'payment-failed': 'M12 9v2m0 4h.01M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z',
  'support-ticket-updated': 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  'shipment-delayed': 'M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1M2 11h20',
  'customer-profile-updated': 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  'risk-signal-generated': 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  'ai-recommendation-created': 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 12 18.469V19',
};

function eventLabel(type: string): string {
  return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function ReplayPanel() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [replayEvents, setReplayEvents] = useState<ReplayEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [currentRiskScore, setCurrentRiskScore] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.fetchReplayScenarios().then(setScenarios).catch(() => {});
  }, []);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [replayEvents]);

  const startReplay = useCallback((scenarioId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setReplayEvents([]);
    setProgress(0);
    setCurrentRiskScore(0);
    setCurrentAction('');
    setIsPlaying(true);
    setIsPaused(false);
    setSelectedScenario(scenarioId);

    const source = new EventSource(
      `${api.baseUrl}/api/replay/stream/${scenarioId}?speed=${speed}`
    );
    eventSourceRef.current = source;

    source.addEventListener('replay-event', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setReplayEvents(prev => [...prev, data.event]);
      setProgress(data.progress);

      if (data.event.event_type === 'risk-signal-generated') {
        setCurrentRiskScore(data.event.metadata.risk_score as number);
      }
      if (data.event.event_type === 'ai-recommendation-created') {
        setCurrentAction(data.event.metadata.action as string);
      }
    });

    source.addEventListener('replay-complete', () => {
      setIsPlaying(false);
      source.close();
    });

    source.onerror = () => {
      setIsPlaying(false);
      source.close();
    };
  }, [speed]);

  const stopReplay = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const restartReplay = useCallback(() => {
    if (selectedScenario) {
      startReplay(selectedScenario);
    }
  }, [selectedScenario, startReplay]);

  function scoreColor(score: number): string {
    if (score >= 60) return '#f87171';
    if (score >= 30) return '#fbbf24';
    return '#34d399';
  }

  return (
    <div className="space-y-5">
      {/* Scenario selector + controls */}
      <div className="card-gradient">
        <div className="relative z-[1]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Event Replay</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Replay customer journey incidents with animated timeline
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Speed selector */}
              <div className="flex items-center gap-1">
                {[1, 2, 5, 10].map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className="text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all"
                    style={speed === s
                      ? { background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }
                    }>
                    {s}x
                  </button>
                ))}
              </div>

              {/* Play controls */}
              <div className="flex items-center gap-1">
                {!isPlaying ? (
                  <button onClick={() => selectedScenario ? startReplay(selectedScenario) : null}
                    disabled={!selectedScenario}
                    className="text-xs px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-30"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white' }}>
                    ▶ Play
                  </button>
                ) : (
                  <button onClick={stopReplay}
                    className="text-xs px-4 py-2 rounded-xl font-semibold"
                    style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#f87171' }}>
                    ■ Stop
                  </button>
                )}
                <button onClick={restartReplay} disabled={!selectedScenario}
                  className="text-xs px-3 py-2 rounded-xl font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                  ↻ Restart
                </button>
              </div>
            </div>
          </div>

          {/* Scenario cards */}
          <div className="grid grid-cols-2 gap-3">
            {scenarios.map(scenario => (
              <button key={scenario.id} onClick={() => { setSelectedScenario(scenario.id); if (!isPlaying) startReplay(scenario.id); }}
                className="text-left p-4 rounded-xl transition-all"
                style={selectedScenario === scenario.id
                  ? { background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)' }
                }>
                <p className="text-sm font-semibold text-white">{scenario.name}</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{scenario.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--purple-light)' }}>{scenario.customer_id}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{scenario.event_count} events</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>~{scenario.duration_seconds}s</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {(isPlaying || replayEvents.length > 0) && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {replayEvents.length} / {scenarios.find(s => s.id === selectedScenario)?.event_count || '?'} events
            </span>
            <span className="text-xs font-mono" style={{ color: 'var(--purple-light)' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%`, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* Live metrics during replay */}
      {replayEvents.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Events</p>
            <p className="text-2xl font-bold text-white">{replayEvents.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Risk Score</p>
            <p className="text-2xl font-bold" style={{ color: scoreColor(currentRiskScore) }}>{currentRiskScore}</p>
          </div>
          <div className="card text-center">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Customer</p>
            <p className="text-sm font-mono font-bold text-white">{replayEvents[0]?.customer_id || '—'}</p>
          </div>
          <div className="card text-center">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Action</p>
            <p className="text-xs font-bold" style={{ color: currentAction ? '#a78bfa' : 'var(--text-muted)' }}>
              {currentAction ? currentAction.replace(/_/g, ' ') : 'Pending...'}
            </p>
          </div>
        </div>
      )}

      {/* Animated timeline */}
      {replayEvents.length > 0 && (
        <div className="card" style={{ maxHeight: '500px', overflow: 'hidden' }}>
          <p className="text-sm font-semibold text-white mb-4">Incident Timeline</p>
          <div ref={timelineRef} className="relative pl-8 space-y-4 overflow-y-auto max-h-[420px] pr-2">
            <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: 'linear-gradient(180deg, var(--purple-light), transparent)' }} />
            {replayEvents.map((event, index) => {
              const colors = EVENT_COLORS[event.event_type] || { bg: 'rgba(100,100,130,0.15)', text: '#8888a4', glow: 'rgba(100,100,130,0.3)' };
              const isLatest = index === replayEvents.length - 1;
              const iconPath = EVENT_ICONS[event.event_type] || 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';

              return (
                <div key={event.event_id} className="relative" style={{
                  animation: 'fadeSlideIn 0.4s ease-out',
                }}>
                  {/* Timeline dot */}
                  <div className="absolute -left-5 top-3 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: colors.bg,
                      border: `2px solid ${colors.text}`,
                      boxShadow: isLatest ? `0 0 12px ${colors.glow}` : 'none',
                    }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors.text }} />
                  </div>

                  {/* Event card */}
                  <div className="rounded-xl p-4 transition-all" style={{
                    background: isLatest ? colors.bg : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isLatest ? colors.text + '40' : 'var(--border-card)'}`,
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={iconPath} />
                        </svg>
                        <span className="text-xs font-semibold" style={{ color: colors.text }}>
                          {eventLabel(event.event_type)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        +{(event.delay_ms / 1000).toFixed(1)}s
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(event.metadata).map(([key, value]) => {
                        if (key === 'contributing_signals' && Array.isArray(value)) {
                          return value.map((s, i) => (
                            <span key={`${key}-${i}`} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>
                              {s}
                            </span>
                          ));
                        }
                        if (key === 'reason' && Array.isArray(value)) {
                          return value.map((r, i) => (
                            <span key={`${key}-${i}`} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
                              {r}
                            </span>
                          ));
                        }
                        if (typeof value === 'object') return null;
                        return (
                          <span key={key} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                            {key}: {String(value)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
