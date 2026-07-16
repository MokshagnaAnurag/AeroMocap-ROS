// AeroMocap ROS — Vision Array Page
// Camera management workspace with card-based layout

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { CameraInfo } from '@/types';

// ── Exposure / Gain mini bar ──────────────────────────────────────────────────
const MiniBar: React.FC<{ value: number; max?: number; color?: string }> = ({
  value, max = 255, color = 'var(--accent-primary)'
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
    <div className="progress-bar-track" style={{ flex: 1 }}>
      <div className="progress-bar-fill" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', minWidth: 24 }}>
      {value}
    </span>
  </div>
);

// ── Source type badge ─────────────────────────────────────────────────────────
const SourceBadge: React.FC<{ type: string }> = ({ type }) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    synthetic:  { label: 'SYN',  color: 'var(--accent-secondary)', bg: 'rgba(77,200,255,0.1)' },
    ps3eye:     { label: 'PS3',  color: 'var(--accent-primary)',   bg: 'rgba(139,255,77,0.1)' },
    usb:        { label: 'USB',  color: 'var(--accent-warn)',      bg: 'rgba(255,184,77,0.1)' },
    video_file: { label: 'VID',  color: 'var(--accent-purple)',    bg: 'rgba(167,139,250,0.1)' },
  };
  const s = map[type] ?? { label: type.toUpperCase().slice(0, 3), color: 'var(--text-muted)', bg: 'var(--bg-overlay)' };
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
      padding: '1px 6px', borderRadius: 2,
      color: s.color, background: s.bg,
      border: `1px solid ${s.color}44`,
      letterSpacing: '0.06em',
    }}>
      {s.label}
    </span>
  );
};

// ── Camera Card ───────────────────────────────────────────────────────────────
const CameraCard: React.FC<{ cam: CameraInfo; onUpdate: (id: string, d: Partial<CameraInfo>) => void }> = ({ cam, onUpdate }) => {
  const isConnected = cam.status === 'connected';
  const [exp, setExp] = useState(cam.exposure);
  const [gain, setGain] = useState(cam.gain);

  const applySettings = () => {
    onUpdate(cam.id, { exposure: exp, gain });
  };

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: `1px solid ${isConnected ? 'var(--border)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--border-radius-lg)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Card Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>
            {cam.id}
          </span>
          <SourceBadge type={cam.source_type} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="status-dot" style={{
            background: isConnected ? 'var(--status-online)' : 'var(--status-offline)',
            ...(isConnected ? { boxShadow: '0 0 6px var(--status-online)' } : {}),
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
            color: isConnected ? 'var(--status-online)' : 'var(--status-offline)',
            letterSpacing: '0.06em',
          }}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* ── Preview ── */}
      <div style={{
        height: 120,
        background: 'var(--bg-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Synthetic camera: animated dot preview */}
        {cam.source_type === 'synthetic' ? (
          <SyntheticPreview />
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            color: 'var(--text-muted)',
          }}>
            <span style={{ fontSize: 28 }}>◎</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em' }}>
              NO FEED
            </span>
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 4, right: 6,
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
          letterSpacing: '0.06em',
        }}>
          {cam.width}×{cam.height}
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          { label: 'Source',     value: cam.source_type.replace('_', ' ') },
          { label: 'FPS',        value: `${cam.fps}` },
          { label: 'Resolution', value: `${cam.width} × ${cam.height}` },
          { label: 'Dropped',    value: `${cam.dropped_frames}` },
          { label: 'Latency',    value: `${cam.latency_ms.toFixed(1)} ms` },
        ].map(row => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {row.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
              {row.value}
            </span>
          </div>
        ))}

        {/* Exposure slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', width: 52, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Exposure
          </span>
          <MiniBar value={exp} color="var(--accent-primary)" />
        </div>
        <input
          type="range" min={0} max={255} value={exp}
          onChange={e => setExp(Number(e.target.value))}
          onMouseUp={applySettings}
          style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          disabled={!isConnected}
        />

        {/* Gain slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', width: 52, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Gain
          </span>
          <MiniBar value={gain} max={63} color="var(--accent-secondary)" />
        </div>
        <input
          type="range" min={0} max={63} value={gain}
          onChange={e => setGain(Number(e.target.value))}
          onMouseUp={applySettings}
          style={{ width: '100%', accentColor: 'var(--accent-secondary)', cursor: 'pointer' }}
          disabled={!isConnected}
        />
      </div>

      {/* ── Actions ── */}
      <div style={{
        padding: '8px 12px',
        display: 'flex', gap: 6,
        borderTop: '1px solid var(--border)',
      }}>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          Configure
        </button>
        <button
          className={isConnected ? 'btn btn-danger btn-sm' : 'btn btn-ghost btn-sm'}
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => onUpdate(cam.id, { status: isConnected ? 'disconnected' : 'connected' })}
        >
          {isConnected ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
};

// ── Synthetic Preview: animated sine dot ──────────────────────────────────────
const SyntheticPreview: React.FC = () => {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(p => p + 0.04), 50);
    return () => clearInterval(id);
  }, []);
  const cx = 50 + 35 * Math.cos(t);
  const cy = 50 + 35 * Math.sin(t);
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
      <rect width="100" height="100" fill="#080B0F" />
      {/* grid */}
      {[20,40,60,80].map(v => (
        <React.Fragment key={v}>
          <line x1={v} y1={0} x2={v} y2={100} stroke="#1A2333" strokeWidth={0.5} />
          <line x1={0} y1={v} x2={100} y2={v} stroke="#1A2333" strokeWidth={0.5} />
        </React.Fragment>
      ))}
      {/* trail */}
      {Array.from({ length: 20 }, (_, i) => {
        const tt = t - i * 0.04;
        return (
          <circle key={i}
            cx={50 + 35 * Math.cos(tt)} cy={50 + 35 * Math.sin(tt)}
            r={1.5 - i * 0.07}
            fill="#4DC8FF" opacity={(1 - i / 20) * 0.5}
          />
        );
      })}
      {/* main dot */}
      <circle cx={cx} cy={cy} r={3} fill="#8BFF4D" />
      <circle cx={cx} cy={cy} r={5} fill="none" stroke="#8BFF4D" strokeWidth={0.8} opacity={0.4} />
      {/* label */}
      <text x={2} y={8} fill="#4DC8FF" fontSize={5} fontFamily="monospace">SYN</text>
    </svg>
  );
};

// ── Vision Array Page ─────────────────────────────────────────────────────────
export const VisionArray: React.FC = () => {
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.cameras.list().then(r => {
      setCameras(r.cameras);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleUpdate = (id: string, data: Partial<CameraInfo>) => {
    api.cameras.update(id, data).then(r => {
      setCameras(prev => prev.map(c => c.id === id ? r.camera : c));
    });
  };

  const handleAdd = () => {
    api.cameras.add({ source_type: 'synthetic' }).then(r => {
      setCameras(prev => [...prev, r.camera]);
    });
  };

  return (
    <div className="page-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Toolbar ── */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
            Vision Array
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', padding: '2px 8px',
            background: 'var(--bg-elevated)', borderRadius: 2,
            border: '1px solid var(--border)',
          }}>
            {cameras.length} SOURCE{cameras.length !== 1 ? 'S' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button id="btn-add-camera" className="btn btn-primary btn-sm" onClick={handleAdd}>
            + Add Camera
          </button>
          <button className="btn btn-ghost btn-sm">⟳ Refresh</button>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 12 }}>
              Loading camera sources…
            </span>
          </div>
        ) : cameras.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 12,
          }}>
            <span style={{ fontSize: 40, opacity: 0.3 }}>◎</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 12 }}>
              No camera sources configured.
            </span>
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>
              + Add Synthetic Camera
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
            alignItems: 'start',
          }}>
            {cameras.map(cam => (
              <CameraCard key={cam.id} cam={cam} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
