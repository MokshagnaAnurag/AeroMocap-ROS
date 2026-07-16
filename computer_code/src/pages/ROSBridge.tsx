// AeroMocap ROS — ROS Bridge Page
import React, { useState } from 'react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useSocketEvent } from '@/hooks/useSocket';

interface ROSTopicRow { name: string; type: string; rateHz: number; enabled: boolean }

const TOPICS: ROSTopicRow[] = [
  { name: '/aeromocap/object_0/pose', type: 'geometry_msgs/PoseStamped', rateHz: 30, enabled: true },
  { name: '/aeromocap/object_1/pose', type: 'geometry_msgs/PoseStamped', rateHz: 30, enabled: false },
  { name: '/aeromocap/status',        type: 'std_msgs/String',            rateHz: 1,  enabled: true },
];

export const ROSBridge: React.FC = () => {
  const health = useSystemHealth();
  const [bridgeActive, setBridgeActive] = useState(false);
  const [prefix, setPrefix] = useState('/aeromocap');
  const [frameId, setFrameId] = useState('map');
  const [rate, setRate] = useState(30);
  const [lastMsg, setLastMsg] = useState<string | null>(null);

  useSocketEvent('system-status', (data: unknown) => {
    const d = data as { ros2_connected?: boolean };
    if (d?.ros2_connected !== undefined) {
      setBridgeActive(d.ros2_connected);
    }
  });

  return (
    <div className="page-enter" style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* ── Left: Main Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

        {/* ── Status Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          padding: '12px 16px',
          background: bridgeActive ? 'rgba(139,255,77,0.06)' : 'var(--bg-panel)',
          border: `1px solid ${bridgeActive ? 'rgba(139,255,77,0.25)' : 'var(--border)'}`,
          borderRadius: 'var(--border-radius-lg)',
        }}>
          <span className="status-dot" style={{
            background: bridgeActive ? 'var(--status-online)' : 'var(--status-offline)',
            width: 10, height: 10,
            ...(bridgeActive ? { boxShadow: '0 0 8px var(--status-online)' } : {}),
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>
              ROS 2 Bridge — {bridgeActive ? 'ACTIVE' : 'INACTIVE'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
              Distribution: ROS 2 Humble · Node: /aeromocap_ros_node · DDS: Fast-DDS
            </div>
          </div>
          <button
            id="btn-ros-bridge-toggle"
            className={bridgeActive ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={() => setBridgeActive(a => !a)}
          >
            {bridgeActive ? '⏹ Stop Bridge' : '▶ Start Bridge'}
          </button>
        </div>

        {/* ── Published Topics ── */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Published Topics</div>
          <div style={{
            background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: 'var(--border-radius)', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  {['Topic', 'Type', 'Rate', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '7px 14px', textAlign: 'left',
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOPICS.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-secondary)' }}>
                      {t.name}
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                      {t.type}
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)' }}>
                      {t.rateHz} Hz
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <span className="status-dot" style={{
                        background: (bridgeActive && t.enabled) ? 'var(--status-online)' : 'var(--status-inactive)',
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TF Tree ── */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>TF Frame Tree</div>
          <div style={{
            background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: 'var(--border-radius)', padding: '14px 16px',
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--text-secondary)', lineHeight: 2,
          }}>
            <div style={{ color: 'var(--accent-secondary)' }}>map</div>
            <div style={{ paddingLeft: 20 }}>
              <span style={{ color: 'var(--text-muted)' }}>├── </span>
              <span style={{ color: bridgeActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>mocap_object_0</span>
            </div>
            <div style={{ paddingLeft: 20 }}>
              <span style={{ color: 'var(--text-muted)' }}>└── </span>
              <span style={{ color: 'var(--text-muted)' }}>mocap_object_1</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 8 }}>(inactive)</span>
            </div>
          </div>
        </div>

        {/* ── RViz note ── */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(77,200,255,0.06)',
          border: '1px solid rgba(77,200,255,0.2)',
          borderRadius: 'var(--border-radius)',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--accent-secondary)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>RViz Visualization</div>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Run: <code style={{ color: 'var(--accent-primary)' }}>
              ros2 launch aeromocap_ros visualization.launch.py
            </code>
            <br />
            Fixed frame: <code style={{ color: 'var(--text-primary)' }}>map</code>
            · Displays: TF, PoseStamped markers, Path trajectory
          </div>
        </div>
      </div>

      {/* ── Right: Configuration ── */}
      <div style={{
        width: 260, flexShrink: 0, borderLeft: '1px solid var(--border)',
        background: 'var(--bg-panel)', padding: 16, overflowY: 'auto',
      }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Bridge Configuration</div>

        {[
          { label: 'Topic Prefix', value: prefix, setter: setPrefix, id: 'ros-prefix' },
          { label: 'Frame ID',     value: frameId, setter: setFrameId, id: 'ros-frame' },
        ].map(field => (
          <div key={field.id} style={{ marginBottom: 12 }}>
            <label style={{
              display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.07em', marginBottom: 4,
            }}>
              {field.label}
            </label>
            <input
              id={field.id}
              value={field.value}
              onChange={e => field.setter(e.target.value)}
              style={{
                width: '100%', background: 'var(--bg-base)',
                border: '1px solid var(--border)', borderRadius: 'var(--border-radius)',
                padding: '6px 10px', color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)', fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 12 }}>
          <label style={{
            display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.07em', marginBottom: 4,
          }}>
            Publish Rate (Hz)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min={1} max={100} value={rate}
              onChange={e => setRate(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-primary)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', minWidth: 28 }}>
              {rate}
            </span>
          </div>
        </div>

        <div className="divider" />

        <div className="section-title" style={{ marginBottom: 10 }}>Node Status</div>
        {[
          { label: 'ROS Dist',   value: 'Humble' },
          { label: 'Domain ID',  value: '0' },
          { label: 'Node',       value: bridgeActive ? 'ACTIVE' : 'STOPPED',
            color: bridgeActive ? 'var(--accent-primary)' : 'var(--text-muted)' },
          { label: 'QoS',        value: 'RELIABLE' },
          { label: 'Last Pub',   value: bridgeActive ? 'now' : '—' },
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
  );
};
