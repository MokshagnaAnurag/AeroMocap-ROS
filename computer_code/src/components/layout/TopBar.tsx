// AeroMocap ROS by Anurag — Top Bar Component
import React from 'react';
import type { SystemHealth } from '@/hooks/useSystemHealth';

interface TopBarProps {
  pageTitle: string;
  health: SystemHealth;
}

export const TopBar: React.FC<TopBarProps> = ({ pageTitle, health }) => {
  const systemState =
    health.backendState === 'offline' ? 'OFFLINE' :
    health.backendState === 'degraded' ? 'DEGRADED' : 'ONLINE';

  const stateColor =
    systemState === 'ONLINE' ? 'var(--status-online)' :
    systemState === 'DEGRADED' ? 'var(--status-degraded)' :
    'var(--status-offline)';

  return (
    <header style={{
      height: 'var(--topbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-panel)',
      gap: 16,
      flexShrink: 0,
    }}>
      {/* ── Page Title ── */}
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 600, fontSize: 14,
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
      }}>
        {pageTitle}
      </div>

      {/* ── Center: Quick Stats ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)',
      }}>
        <span>
          <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>FPS</span>
          <span style={{ color: 'var(--accent-primary)' }}>{health.fps.toFixed(1)}</span>
        </span>
        <span>
          <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>LAT</span>
          <span style={{ color: 'var(--accent-secondary)' }}>{health.latencyMs.toFixed(1)}ms</span>
        </span>
        <span>
          <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>OBJS</span>
          <span style={{ color: 'var(--text-primary)' }}>{health.trackedObjects}</span>
        </span>
        <span>
          <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>FILTER</span>
          <span style={{ color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>{health.filter}</span>
        </span>
      </div>

      {/* ── Right: System State ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="badge" style={{
          background: `${stateColor}18`,
          color: stateColor,
          border: `1px solid ${stateColor}44`,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          padding: '3px 10px',
          borderRadius: 2,
          letterSpacing: '0.08em',
        }}>
          <span className={systemState === 'ONLINE' ? 'pulse' : ''} style={{
            display: 'inline-block',
            width: 5, height: 5,
            borderRadius: '50%',
            background: stateColor,
            marginRight: 5,
          }} />
          SYSTEM {systemState}
        </div>
      </div>
    </header>
  );
};
