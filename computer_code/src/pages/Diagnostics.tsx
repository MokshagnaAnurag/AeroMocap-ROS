// AeroMocap ROS — System Diagnostics Page
import React, { useState, useEffect, useRef } from 'react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useSocketEvent } from '@/hooks/useSocket';
import type { LogEntry } from '@/types';

let _logId = 0;
function makeLog(level: LogEntry['level'], message: string, source = 'aeromocap'): LogEntry {
  return { id: String(++_logId), level, timestamp: Date.now(), message, source };
}

const LEVEL_COLORS: Record<string, string> = {
  INFO:  'var(--accent-secondary)',
  WARN:  'var(--accent-warn)',
  ERROR: 'var(--accent-critical)',
  DEBUG: 'var(--text-muted)',
};

const LEVEL_BG: Record<string, string> = {
  INFO:  'transparent',
  WARN:  'rgba(255,184,77,0.05)',
  ERROR: 'rgba(255,92,92,0.07)',
  DEBUG: 'transparent',
};

type LevelFilter = 'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export const Diagnostics: React.FC = () => {
  const health = useSystemHealth();
  const [logs, setLogs] = useState<LogEntry[]>([
    makeLog('INFO',  'AeroMocap ROS backend started.', 'app'),
    makeLog('INFO',  'Simulation engine initialised.', 'sim'),
    makeLog('INFO',  'Socket.IO server listening on port 3001.', 'socketio'),
    makeLog('INFO',  'Config loaded: mode=simulation, filter=kalman.', 'config'),
  ]);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  // Receive live log events from backend
  useSocketEvent('system-status', (data: unknown) => {
    const d = data as { mode?: string; fps?: number; tracking_active?: boolean };
    if (d?.fps !== undefined) {
      setLogs(prev => [...prev.slice(-499), makeLog('DEBUG', `FPS: ${d.fps?.toFixed(1)} | mode: ${d.mode}`, 'metrics')]);
    }
  });

  useSocketEvent('tracking-state', (data: unknown) => {
    const d = data as { active?: boolean };
    setLogs(prev => [...prev.slice(-499), makeLog('INFO', `Tracking ${d.active ? 'started' : 'stopped'}.`, 'engine')]);
  });

  useSocketEvent('disconnect', () => {
    setLogs(prev => [...prev.slice(-499), makeLog('WARN', 'Socket.IO disconnected — attempting reconnect…', 'socketio')]);
  });

  useSocketEvent('connect', () => {
    setLogs(prev => [...prev.slice(-499), makeLog('INFO', 'Socket.IO connected.', 'socketio')]);
  });

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filtered = levelFilter === 'ALL' ? logs : logs.filter(l => l.level === levelFilter);

  const fmt = (ts: number) => new Date(ts).toISOString().slice(11, 23);

  return (
    <div className="page-enter" style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* ── Left: Log Console ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Log Toolbar */}
        <div style={{
          padding: '8px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0, background: 'var(--bg-panel)',
        }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
            System Log Console
          </span>
          {(['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as LevelFilter[]).map(l => (
            <button key={l}
              className={levelFilter === l ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
              style={{ color: l !== 'ALL' ? LEVEL_COLORS[l] : undefined }}
              onClick={() => setLevelFilter(l)}>
              {l}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setAutoScroll(a => !a)}>
            {autoScroll ? '⟳ Auto' : '⊘ Auto'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setLogs([])}>
            ✕ Clear
          </button>
        </div>

        {/* Log Lines */}
        <div
          ref={logRef}
          style={{
            flex: 1, overflowY: 'auto',
            background: 'var(--bg-base)',
            padding: '4px 0',
            fontFamily: 'var(--font-mono)', fontSize: 11,
          }}
        >
          {filtered.map(log => (
            <div key={log.id} style={{
              display: 'flex', gap: 0, alignItems: 'baseline',
              padding: '2px 12px',
              background: LEVEL_BG[log.level],
              borderLeft: `2px solid ${log.level !== 'INFO' && log.level !== 'DEBUG' ? LEVEL_COLORS[log.level] : 'transparent'}`,
            }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 90, flexShrink: 0 }}>
                {fmt(log.timestamp)}
              </span>
              <span style={{
                color: LEVEL_COLORS[log.level], minWidth: 42, flexShrink: 0,
                fontWeight: 600, letterSpacing: '0.04em',
              }}>
                {log.level.padEnd(5)}
              </span>
              <span style={{ color: 'var(--text-muted)', minWidth: 72, flexShrink: 0, fontSize: 10 }}>
                [{log.source}]
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {log.message}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '20px 12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              No log entries matching filter.
            </div>
          )}
        </div>

        {/* Log count */}
        <div style={{
          padding: '4px 14px', borderTop: '1px solid var(--border)',
          background: 'var(--bg-panel)', flexShrink: 0,
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
          display: 'flex', gap: 16,
        }}>
          <span>{filtered.length} entries shown</span>
          <span>{logs.length} total</span>
          <span>{logs.filter(l => l.level === 'ERROR').length} errors</span>
          <span>{logs.filter(l => l.level === 'WARN').length} warnings</span>
        </div>
      </div>

      {/* ── Right: Metrics Panel ── */}
      <div style={{
        width: 240, flexShrink: 0, borderLeft: '1px solid var(--border)',
        background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 12 }}>Live Metrics</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

          <div className="section-title" style={{ marginBottom: 8 }}>Connections</div>
          {[
            { label: 'Backend',  value: health.backendState, isStatus: true },
            { label: 'Socket',   value: health.socketState,  isStatus: true },
            { label: 'ROS 2',    value: health.ros2State,    isStatus: true },
            { label: 'PX4',      value: health.px4State,     isStatus: true },
          ].map(r => (
            <div key={r.label} className="kv-row" style={{ padding: '5px 0' }}>
              <span className="kv-label">{r.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className="status-dot" style={{
                  background: {
                    online: 'var(--status-online)', degraded: 'var(--status-degraded)',
                    offline: 'var(--status-offline)', inactive: 'var(--status-inactive)',
                  }[r.value] ?? 'var(--status-inactive)',
                }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {r.value}
                </span>
              </div>
            </div>
          ))}

          <div className="divider" />

          <div className="section-title" style={{ marginBottom: 8 }}>Performance</div>
          {[
            { label: 'FPS',        value: `${health.fps.toFixed(1)} Hz`,    color: 'var(--accent-primary)' },
            { label: 'Latency',    value: `${health.latencyMs.toFixed(1)} ms` },
            { label: 'Dropped',    value: `${health.droppedFrames}`,         color: health.droppedFrames > 0 ? 'var(--accent-warn)' : undefined },
            { label: 'Uptime',     value: `${health.uptimeS.toFixed(0)} s` },
            { label: 'Objects',    value: `${health.trackedObjects}` },
            { label: 'Cameras',    value: health.camerasConnected === 0 ? 'SYN' : `${health.camerasConnected}` },
          ].map(r => (
            <div key={r.label} className="kv-row" style={{ padding: '4px 0' }}>
              <span className="kv-label">{r.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: r.color ?? 'var(--text-primary)' }}>
                {r.value}
              </span>
            </div>
          ))}

          <div className="divider" />

          <div className="section-title" style={{ marginBottom: 8 }}>System</div>
          {[
            { label: 'Mode',    value: health.mode.toUpperCase(), color: 'var(--accent-secondary)' },
            { label: 'Filter',  value: health.filter.toUpperCase(), color: 'var(--accent-secondary)' },
            { label: 'Version', value: '1.0.0' },
          ].map(r => (
            <div key={r.label} className="kv-row" style={{ padding: '4px 0' }}>
              <span className="kv-label">{r.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: r.color ?? 'var(--text-secondary)' }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
