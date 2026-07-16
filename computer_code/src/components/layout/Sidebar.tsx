// AeroMocap ROS — Sidebar Navigation Component
import React, { useState } from 'react';
import { NavPage, ConnectionState } from '@/types';
import type { SystemHealth } from '@/hooks/useSystemHealth';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  health: SystemHealth;
}

interface NavItem {
  id: NavPage;
  label: string;
  icon: string;
  connectionState?: ConnectionState;
  experimental?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'mission-control', label: 'Mission Control', icon: '⬡' },
  { id: 'vision-array',    label: 'Vision Array',    icon: '◎' },
  { id: 'calibration-lab', label: 'Calibration Lab', icon: '◈' },
  { id: 'track-space',     label: 'Track Space',     icon: '⊕' },
  { id: 'ros-bridge',      label: 'ROS Bridge',      icon: '⟳' },
  { id: 'px4-link',        label: 'PX4 Link',        icon: '◇', experimental: true },
  { id: 'diagnostics',     label: 'Diagnostics',     icon: '▤' },
  { id: 'configuration',   label: 'Configuration',   icon: '⚙' },
];

const STATE_COLORS: Record<ConnectionState, string> = {
  online:   'var(--status-online)',
  degraded: 'var(--status-degraded)',
  offline:  'var(--status-offline)',
  inactive: 'var(--status-inactive)',
};

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, health }) => {
  const [collapsed, setCollapsed] = useState(false);

  const getItemState = (id: NavPage): ConnectionState => {
    if (id === 'ros-bridge') return health.ros2State;
    if (id === 'px4-link') return health.px4State;
    return 'inactive';
  };

  return (
    <aside style={{
      width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      minWidth: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width var(--transition-base)',
      overflow: 'hidden',
      zIndex: 10,
      flexShrink: 0,
    }}>

      {/* ── Logo / Identity ── */}
      <div style={{
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        borderBottom: '1px solid var(--border)',
        gap: 10,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, flexShrink: 0,
          background: 'var(--accent-primary)',
          borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'var(--text-on-accent)',
          fontFamily: 'var(--font-mono)',
        }}>
          ◈
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700, fontSize: 13,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              AeroMocap
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--accent-secondary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              ROS EDITION
            </div>
          </div>
        )}
      </div>

      {/* ── Mode Badge ── */}
      {!collapsed && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="status-dot" style={{
              background: health.mode === 'simulation' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {health.mode.toUpperCase()} MODE
            </span>
          </div>
        </div>
      )}

      {/* ── Navigation Items ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.id;
          const itemState = getItemState(item.id);
          const hasIndicator = item.id === 'ros-bridge' || item.id === 'px4-link';

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '9px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: isActive ? 500 : 400,
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              <span style={{
                fontSize: 15, flexShrink: 0, width: 18, textAlign: 'center',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.experimental && (
                    <span style={{
                      fontSize: 8, fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-purple)', textTransform: 'uppercase',
                      letterSpacing: '0.05em', opacity: 0.8,
                    }}>
                      BETA
                    </span>
                  )}
                  {hasIndicator && (
                    <span className="status-dot" style={{
                      background: STATE_COLORS[itemState],
                      width: 5, height: 5,
                    }} />
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Collapse Toggle ── */}
      <button
        id="sidebar-collapse-btn"
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: '100%', padding: '10px 0',
          background: 'transparent', border: 'none', borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'var(--transition-fast)',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '→' : '←'}
      </button>
    </aside>
  );
};
