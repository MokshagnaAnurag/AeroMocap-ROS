// AeroMocap ROS — Telemetry Strip Component
// Displays live X/Y/Z position, velocity, confidence, filter
import React from 'react';
import type { TrackedObject } from '@/types';

interface TelemetryStripProps {
  object: TrackedObject | null;
  fps: number;
  latencyMs: number;
  droppedFrames: number;
}

interface CoordCardProps {
  axis: string;
  value: number;
  color?: string;
}

const CoordCard: React.FC<CoordCardProps> = ({ axis, value, color = 'var(--text-primary)' }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80,
  }}>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 9,
      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      {axis}
    </div>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600,
      color, letterSpacing: '-0.01em', lineHeight: 1,
    }}>
      {value >= 0 ? '+' : ''}{value.toFixed(3)}
      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>m</span>
    </div>
  </div>
);

interface MetricCellProps {
  label: string;
  value: string;
  color?: string;
  unit?: string;
}

const MetricCell: React.FC<MetricCellProps> = ({ label, value, color, unit }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 9,
      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      {label}
    </div>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600,
      color: color ?? 'var(--text-primary)', lineHeight: 1,
    }}>
      {value}
      {unit && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>}
    </div>
  </div>
);

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({ object, fps, latencyMs, droppedFrames }) => {
  const pos = object?.pos ?? [0, 0, 0];
  const vel = object?.vel ?? [0, 0, 0];
  const speed = Math.sqrt(vel[0] ** 2 + vel[1] ** 2 + vel[2] ** 2);
  const confidence = (object?.confidence ?? 0) * 100;

  return (
    <div style={{
      background: 'var(--bg-panel)',
      borderTop: '1px solid var(--border)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexShrink: 0,
      overflowX: 'auto',
    }}>
      {/* ── Position ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="section-title">Position</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <CoordCard axis="X" value={pos[0]} color="var(--accent-critical)" />
          <CoordCard axis="Y" value={pos[1]} color="var(--accent-primary)" />
          <CoordCard axis="Z" value={pos[2]} color="var(--accent-secondary)" />
        </div>
      </div>

      <div style={{ width: 1, height: 48, background: 'var(--border)', flexShrink: 0 }} />

      {/* ── Velocity ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="section-title">Velocity</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <MetricCell label="SPEED" value={speed.toFixed(3)} unit="m/s" color="var(--accent-warn)" />
          <MetricCell label="VX" value={vel[0].toFixed(3)} />
          <MetricCell label="VY" value={vel[1].toFixed(3)} />
          <MetricCell label="VZ" value={vel[2].toFixed(3)} />
        </div>
      </div>

      <div style={{ width: 1, height: 48, background: 'var(--border)', flexShrink: 0 }} />

      {/* ── Quality ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="section-title">Quality</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <MetricCell
            label="CONFIDENCE"
            value={confidence.toFixed(1)}
            unit="%"
            color={confidence > 90 ? 'var(--accent-primary)' : confidence > 70 ? 'var(--accent-warn)' : 'var(--accent-critical)'}
          />
          <MetricCell
            label="REPR ERR"
            value={(object?.reprojection_error ?? 0).toFixed(2)}
            unit="px"
          />
        </div>
      </div>

      <div style={{ width: 1, height: 48, background: 'var(--border)', flexShrink: 0 }} />

      {/* ── Performance ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="section-title">Performance</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <MetricCell label="FPS" value={fps.toFixed(1)} color="var(--accent-primary)" />
          <MetricCell label="LATENCY" value={latencyMs.toFixed(1)} unit="ms" />
          <MetricCell
            label="DROPPED"
            value={String(droppedFrames)}
            color={droppedFrames > 0 ? 'var(--accent-warn)' : 'var(--text-secondary)'}
          />
        </div>
      </div>

      <div style={{ width: 1, height: 48, background: 'var(--border)', flexShrink: 0 }} />

      {/* ── Filter ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="section-title">Filter</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
          color: 'var(--accent-secondary)', textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {object?.filter ?? 'KALMAN'}
        </div>
      </div>
    </div>
  );
};
