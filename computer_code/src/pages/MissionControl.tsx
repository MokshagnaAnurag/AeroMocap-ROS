// AeroMocap ROS — Mission Control Page
// Central operations hub: 3D viewport + system health + telemetry + controls

import React, { useState } from 'react';
import { Viewport3D } from '@/components/tracking/Viewport3D';
import { TelemetryStrip } from '@/components/telemetry/TelemetryStrip';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { socketEmit } from '@/services/socket';
import type { ConnectionState } from '@/types';

const StateRow: React.FC<{ label: string; state: ConnectionState; detail?: string }> = ({ label, state, detail }) => {
  const color = {
    online: 'var(--status-online)',
    degraded: 'var(--status-degraded)',
    offline: 'var(--status-offline)',
    inactive: 'var(--status-inactive)',
  }[state];

  return (
    <div className="kv-row" style={{ padding: '5px 0' }}>
      <span className="kv-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {detail && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{detail}</span>}
        <span className="status-dot" style={{ background: color }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {state}
        </span>
      </div>
    </div>
  );
};

const AlertBanner: React.FC<{ mode: string }> = ({ mode }) => {
  if (mode !== 'simulation') return null;
  return (
    <div style={{
      background: 'rgba(77,200,255,0.07)',
      border: '1px solid rgba(77,200,255,0.25)',
      borderRadius: 'var(--border-radius)',
      padding: '7px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-mono)', fontSize: 10,
      color: 'var(--accent-secondary)',
      letterSpacing: '0.05em',
      marginBottom: 8,
    }}>
      <span>◎</span>
      SIMULATION MODE — No physical cameras required. Synthetic trajectory active.
    </div>
  );
};

export const MissionControl: React.FC = () => {
  const telemetry = useTelemetry();
  const health = useSystemHealth();
  const [isTracking, setIsTracking] = useState(true);

  const primaryObject = telemetry.filteredObjects[0] ?? null;

  const handleStartStop = () => {
    if (isTracking) {
      socketEmit.stopTracking();
    } else {
      socketEmit.startTracking();
    }
    setIsTracking(t => !t);
  };

  return (
    <div className="page-enter" style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      gap: 0, overflow: 'hidden',
    }}>
      {/* ── Main Content Row ── */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', minHeight: 0 }}>

        {/* ── 3D Viewport ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Viewport3D
            telemetry={telemetry}
            style={{ flex: 1, minHeight: 0 }}
          />
        </div>

        {/* ── Right Panel ── */}
        <aside style={{
          width: 'var(--right-panel-width)',
          flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-panel)',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

            {/* ── Simulation Alert ── */}
            <AlertBanner mode={health.mode} />

            {/* ── System Health ── */}
            <div style={{ marginBottom: 14 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>System Health</div>
              <StateRow label="Backend"  state={health.backendState} />
              <StateRow label="Tracking" state={health.trackingState} />
              <StateRow label="Socket"   state={health.socketState} />
              <StateRow label="ROS 2"    state={health.ros2State} />
              <StateRow label="PX4"      state={health.px4State} />
            </div>

            <div className="divider" />

            {/* ── Performance Metrics ── */}
            <div style={{ marginBottom: 14 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>Performance</div>
              {[
                { label: 'FPS', value: `${health.fps.toFixed(1)}`, unit: 'Hz', color: 'var(--accent-primary)' },
                { label: 'Latency', value: `${health.latencyMs.toFixed(1)}`, unit: 'ms' },
                { label: 'Dropped', value: `${health.droppedFrames}`, unit: 'frames', color: health.droppedFrames > 0 ? 'var(--accent-warn)' : undefined },
                { label: 'Objects', value: `${health.trackedObjects}`, unit: '' },
                { label: 'Cameras', value: `${health.camerasConnected === 0 ? 'SYN' : health.camerasConnected}`, unit: '' },
                { label: 'Uptime', value: `${health.uptimeS.toFixed(0)}`, unit: 's' },
              ].map(m => (
                <div key={m.label} className="kv-row" style={{ padding: '4px 0' }}>
                  <span className="kv-label">{m.label}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12,
                    color: m.color ?? 'var(--text-primary)',
                  }}>
                    {m.value}
                    {m.unit && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>{m.unit}</span>}
                  </span>
                </div>
              ))}
            </div>

            <div className="divider" />

            {/* ── Object Inspector ── */}
            {primaryObject && (
              <div style={{ marginBottom: 14 }}>
                <div className="section-title" style={{ marginBottom: 8 }}>
                  Object OBJ-{primaryObject.object_id ?? 0}
                </div>
                {[
                  { label: 'X', value: primaryObject.pos[0].toFixed(4), unit: 'm', color: 'var(--accent-critical)' },
                  { label: 'Y', value: primaryObject.pos[1].toFixed(4), unit: 'm', color: 'var(--accent-primary)' },
                  { label: 'Z', value: primaryObject.pos[2].toFixed(4), unit: 'm', color: 'var(--accent-secondary)' },
                  { label: 'Speed', value: Math.sqrt(primaryObject.vel.reduce((s, v) => s + v ** 2, 0)).toFixed(3), unit: 'm/s' },
                  { label: 'Confid', value: `${(primaryObject.confidence * 100).toFixed(1)}`, unit: '%' },
                  { label: 'Filter', value: primaryObject.filter?.toUpperCase() ?? 'KALMAN' },
                ].map(row => (
                  <div key={row.label} className="kv-row" style={{ padding: '4px 0' }}>
                    <span className="kv-label">{row.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: row.color ?? 'var(--text-primary)' }}>
                      {row.value}
                      {row.unit && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>{row.unit}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="divider" />

            {/* ── Controls ── */}
            <div>
              <div className="section-title" style={{ marginBottom: 8 }}>Controls</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  id="btn-start-stop-tracking"
                  className={isTracking ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
                  onClick={handleStartStop}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isTracking ? '⏹ Stop Tracking' : '▶ Start Tracking'}
                </button>
                <button
                  id="btn-filter-kalman"
                  className="btn btn-ghost btn-sm"
                  onClick={() => socketEmit.setFilter('kalman')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  ⟳ Set Kalman Filter
                </button>
                <button
                  id="btn-filter-lowpass"
                  className="btn btn-ghost btn-sm"
                  onClick={() => socketEmit.setFilter('lowpass')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  ∿ Set Low-Pass Filter
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Telemetry Strip (bottom) ── */}
      <TelemetryStrip
        object={primaryObject}
        fps={telemetry.fps}
        latencyMs={telemetry.latencyMs}
        droppedFrames={telemetry.droppedFrames}
      />
    </div>
  );
};
