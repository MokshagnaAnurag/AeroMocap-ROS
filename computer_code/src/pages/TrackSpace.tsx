// AeroMocap ROS — Track Space Page
// Dedicated 3D analysis environment: different layout from Mission Control

import React, { useState, useMemo } from 'react';
import { Viewport3D } from '@/components/tracking/Viewport3D';
import { useTelemetry } from '@/hooks/useTelemetry';
import { socketEmit } from '@/services/socket';
import type { FilterType } from '@/types';

// ── Mini sparkline chart ──────────────────────────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color: string; label: string; unit: string }> = ({ data, color, label, unit }) => {
  const w = 180, h = 42;
  if (data.length < 2) return (
    <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>No data</span>
    </div>
  );

  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 3,
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
      }}>
        <span>{label}</span>
        <span style={{ color }}>{data[data.length - 1]?.toFixed(3)} {unit}</span>
      </div>
      <svg width={w} height={h} style={{ display: 'block' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
        <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((data[data.length - 1] - min) / range) * (h - 6) - 2}
          r={2.5} fill={color} />
      </svg>
    </div>
  );
};

// ── History ring buffer hook ──────────────────────────────────────────────────
function useHistory<T>(value: T, max = 120): T[] {
  const ref = React.useRef<T[]>([]);
  const [, forceUpdate] = React.useState(0);
  React.useEffect(() => {
    ref.current = [...ref.current.slice(-(max - 1)), value];
    forceUpdate(n => n + 1);
  }, [value, max]);
  return ref.current;
}

// ── Track Space Page ──────────────────────────────────────────────────────────
export const TrackSpace: React.FC = () => {
  const telemetry = useTelemetry();
  const [trailLength, setTrailLength] = useState(300);
  const [filterType, setFilterType] = useState<FilterType>('kalman');
  const [paused, setPaused] = useState(false);
  const [frame, setFrame] = useState<'map' | 'camera' | 'body'>('map');

  const primary = telemetry.filteredObjects[0] ?? null;

  // History buffers for sparklines
  const xHistory  = useHistory(primary?.pos[0] ?? 0);
  const yHistory  = useHistory(primary?.pos[1] ?? 0);
  const zHistory  = useHistory(primary?.pos[2] ?? 0);
  const spHistory = useHistory(primary ? Math.sqrt(primary.vel.reduce((s, v) => s + v ** 2, 0)) : 0);
  const cfHistory = useHistory((primary?.confidence ?? 0) * 100);

  const trimmedTrail = useMemo(() =>
    telemetry.trail.slice(-trailLength),
  [telemetry.trail, trailLength]);

  const handleFilter = (f: FilterType) => {
    setFilterType(f);
    socketEmit.setFilter(f);
  };

  const telWithTrail = { ...telemetry, trail: trimmedTrail };

  return (
    <div className="page-enter" style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* ── Left: Large 3D Viewport ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Viewport toolbar */}
        <div style={{
          padding: '8px 12px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0, background: 'var(--bg-panel)',
        }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
            Track Space · 3D Scene
          </span>

          {/* Frame selector */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['map', 'camera', 'body'] as const).map(f => (
              <button key={f} className={frame === f ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                onClick={() => setFrame(f)}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Filter selector */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['none', 'lowpass', 'kalman'] as const).map(f => (
              <button key={f} className={filterType === f ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                onClick={() => handleFilter(f)}>
                {f === 'kalman' ? 'KF' : f === 'lowpass' ? 'LP' : 'RAW'}
              </button>
            ))}
          </div>

          {/* Trail length */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>TRAIL</span>
            <input type="range" min={20} max={400} value={trailLength}
              onChange={e => setTrailLength(Number(e.target.value))}
              style={{ width: 80, accentColor: 'var(--accent-primary)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', minWidth: 28 }}>
              {trailLength}
            </span>
          </div>

          {/* Pause / Clear */}
          <button className={paused ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            onClick={() => setPaused(p => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button className="btn btn-ghost btn-sm" id="btn-clear-trail"
            onClick={() => { /* clear handled in useTelemetry future hook */ }}>
            ✕ Clear
          </button>
        </div>

        <Viewport3D telemetry={paused ? telemetry : telWithTrail} style={{ flex: 1, minHeight: 0 }} />

        {/* Bottom status bar */}
        <div style={{
          padding: '6px 14px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 24, flexShrink: 0, background: 'var(--bg-panel)',
          fontFamily: 'var(--font-mono)', fontSize: 10,
        }}>
          <span style={{ color: 'var(--text-muted)' }}>
            FRAME: <span style={{ color: 'var(--text-primary)' }}>{frame.toUpperCase()}</span>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            OBJECTS: <span style={{ color: telemetry.filteredObjects.length > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              {telemetry.filteredObjects.length}
            </span>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            TRAIL PTS: <span style={{ color: 'var(--text-secondary)' }}>{trimmedTrail.length}</span>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            FPS: <span style={{ color: 'var(--accent-primary)' }}>{telemetry.fps.toFixed(1)}</span>
          </span>
        </div>
      </div>

      {/* ── Right: Inspector + History Charts ── */}
      <div style={{
        width: 240, flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-panel)', overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 12 }}>Object Inspector</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            {primary ? `OBJ-${primary.object_id ?? 0}` : 'NO OBJECT SELECTED'}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {primary ? (
            <>
              {/* Live values */}
              {[
                { label: 'X', value: primary.pos[0].toFixed(4), unit: 'm', color: 'var(--accent-critical)' },
                { label: 'Y', value: primary.pos[1].toFixed(4), unit: 'm', color: 'var(--accent-primary)' },
                { label: 'Z', value: primary.pos[2].toFixed(4), unit: 'm', color: 'var(--accent-secondary)' },
                { label: 'Speed', value: Math.sqrt(primary.vel.reduce((s, v) => s + v ** 2, 0)).toFixed(3), unit: 'm/s' },
                { label: 'Confidence', value: `${(primary.confidence * 100).toFixed(1)}`, unit: '%' },
                { label: 'Heading', value: `${(primary.heading * 180 / Math.PI).toFixed(1)}`, unit: '°' },
              ].map(r => (
                <div key={r.label} className="kv-row" style={{ padding: '4px 0' }}>
                  <span className="kv-label">{r.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: r.color ?? 'var(--text-primary)' }}>
                    {r.value} <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{r.unit}</span>
                  </span>
                </div>
              ))}

              <div className="divider" />

              {/* Sparklines */}
              <div className="section-title" style={{ marginBottom: 8 }}>Position History</div>
              <Sparkline data={xHistory} color="var(--accent-critical)"   label="X" unit="m" />
              <div style={{ marginTop: 8 }}>
                <Sparkline data={yHistory} color="var(--accent-primary)"    label="Y" unit="m" />
              </div>
              <div style={{ marginTop: 8 }}>
                <Sparkline data={zHistory} color="var(--accent-secondary)"  label="Z" unit="m" />
              </div>

              <div className="divider" />

              <div className="section-title" style={{ marginBottom: 8 }}>Velocity & Confidence</div>
              <Sparkline data={spHistory} color="var(--accent-warn)"        label="Speed" unit="m/s" />
              <div style={{ marginTop: 8 }}>
                <Sparkline data={cfHistory} color="var(--accent-primary)"   label="Conf" unit="%" />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                No tracked object
              </span>
            </div>
          )}

          <div className="divider" />

          {/* Export */}
          <button className="btn btn-ghost btn-sm" id="btn-export-tracking"
            style={{ width: '100%', justifyContent: 'center' }}>
            ↓ Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};
