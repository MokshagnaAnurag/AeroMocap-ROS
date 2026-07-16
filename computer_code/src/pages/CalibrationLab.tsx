// AeroMocap ROS — Calibration Lab Page
// 8-stage guided calibration wizard

import React, { useState } from 'react';

type StageStatus = 'pending' | 'active' | 'complete' | 'error';

interface CalibStage {
  id: number;
  title: string;
  description: string;
  action: string;
}

const STAGES: CalibStage[] = [
  { id: 1, title: 'Detect Cameras',           description: 'Scan for connected camera sources and verify feeds.',                  action: 'Scan Now' },
  { id: 2, title: 'Intrinsic Calibration',    description: 'Capture chessboard frames to compute per-camera intrinsic matrices.',   action: 'Capture Frames' },
  { id: 3, title: 'Multi-View Correspondence', description: 'Move a bright marker across the scene while all cameras capture.',     action: 'Start Capture' },
  { id: 4, title: 'Estimate Camera Poses',    description: 'Compute relative camera positions from fundamental matrix decomposition.', action: 'Estimate Poses' },
  { id: 5, title: 'Bundle Adjustment',        description: 'Minimise reprojection error across all cameras simultaneously.',         action: 'Run BA' },
  { id: 6, title: 'Define Physical Scale',    description: 'Place two markers at a known distance to set metric scale.',             action: 'Capture Scale' },
  { id: 7, title: 'World Origin & Floor',     description: 'Fit the floor plane and set the world coordinate origin.',              action: 'Acquire Floor' },
  { id: 8, title: 'Validate & Save',          description: 'Review reprojection error and export calibration profile.',             action: 'Save Profile' },
];

const STAGE_ICON: Record<StageStatus, { icon: string; color: string }> = {
  pending:  { icon: '○',  color: 'var(--text-muted)' },
  active:   { icon: '◈',  color: 'var(--accent-primary)' },
  complete: { icon: '✓',  color: 'var(--status-online)' },
  error:    { icon: '✕',  color: 'var(--accent-critical)' },
};

export const CalibrationLab: React.FC = () => {
  const [currentStage, setCurrentStage] = useState(1);
  const [statuses, setStatuses] = useState<StageStatus[]>(
    STAGES.map((_, i) => (i === 0 ? 'active' : 'pending'))
  );
  const [reprojError, setReprojError] = useState<number | null>(null);
  const [numPoints, setNumPoints] = useState(0);

  const active = STAGES[currentStage - 1];

  const handleAction = () => {
    // Simulate stage completion
    const newStatuses = [...statuses];
    newStatuses[currentStage - 1] = 'complete';
    if (currentStage < STAGES.length) {
      newStatuses[currentStage] = 'active';
      setCurrentStage(currentStage + 1);
    }
    setStatuses(newStatuses);
    setNumPoints(p => p + Math.floor(Math.random() * 20 + 10));
    if (currentStage >= 4) {
      setReprojError(+(Math.random() * 1.2 + 0.3).toFixed(3));
    }
  };

  const handleReset = () => {
    setCurrentStage(1);
    setStatuses(STAGES.map((_, i) => (i === 0 ? 'active' : 'pending')));
    setReprojError(null);
    setNumPoints(0);
  };

  return (
    <div className="page-enter" style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* ── Stage Stepper (left sidebar) ── */}
      <div style={{
        width: 240, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-panel)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13 }}>Calibration Lab</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {statuses.filter(s => s === 'complete').length} / {STAGES.length} STAGES COMPLETE
          </div>
          {/* Progress bar */}
          <div className="progress-bar-track" style={{ marginTop: 8 }}>
            <div className="progress-bar-fill" style={{
              width: `${(statuses.filter(s => s === 'complete').length / STAGES.length) * 100}%`,
              background: 'var(--accent-teal)',
            }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {STAGES.map(stage => {
            const status = statuses[stage.id - 1];
            const { icon, color } = STAGE_ICON[status];
            const isActive = status === 'active';
            return (
              <div
                key={stage.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '8px 14px',
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--accent-teal)' : '2px solid transparent',
                  cursor: 'default',
                }}
              >
                {/* Connector line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 13, color, lineHeight: 1 }}>{icon}</span>
                  {stage.id < STAGES.length && (
                    <div style={{
                      width: 1, height: 18, margin: '3px 0',
                      background: status === 'complete' ? 'var(--accent-teal)' : 'var(--border)',
                    }} />
                  )}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}>
                    {stage.id}. {stage.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost btn-sm" onClick={handleReset} style={{ width: '100%', justifyContent: 'center' }}>
            ↺ Reset Calibration
          </button>
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Stage Detail ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Center: Instructions + Visualization */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: 6,
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--accent-teal)', letterSpacing: '0.08em',
              background: 'rgba(45,212,191,0.1)', padding: '3px 10px',
              borderRadius: 2, border: '1px solid rgba(45,212,191,0.25)',
            }}>
              STAGE {active.id} OF {STAGES.length}
            </div>

            <h2 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22,
              color: 'var(--text-primary)', marginBottom: 8, marginTop: 8,
            }}>
              {active.title}
            </h2>

            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)',
              lineHeight: 1.7, maxWidth: 480, marginBottom: 24,
            }}>
              {active.description}
            </p>

            {/* Stage-specific visualization placeholder */}
            <div style={{
              width: '100%', maxWidth: 500, height: 200,
              background: 'var(--bg-base)', border: '1px solid var(--border)',
              borderRadius: 'var(--border-radius)', marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <CalibVisualization stageId={active.id} />
            </div>

            {/* Action Button */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                id={`calib-action-stage-${active.id}`}
                className="btn btn-primary"
                onClick={handleAction}
                disabled={statuses[active.id - 1] === 'complete'}
              >
                {active.action}
              </button>
              {active.id > 1 && (
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    const newStatuses = [...statuses];
                    newStatuses[active.id - 1] = 'pending';
                    newStatuses[active.id - 2] = 'active';
                    setStatuses(newStatuses);
                    setCurrentStage(currentStage - 1);
                  }}
                >
                  ← Back
                </button>
              )}
            </div>
          </div>

          {/* Right: Metrics panel */}
          <div style={{
            width: 220, flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg-panel)',
            padding: 16, overflowY: 'auto',
          }}>
            <div className="section-title" style={{ marginBottom: 10 }}>Calibration Metrics</div>

            {[
              {
                label: 'Reprojection Error',
                value: reprojError !== null ? `${reprojError.toFixed(3)} px` : '—',
                color: reprojError !== null
                  ? reprojError < 1.0 ? 'var(--accent-primary)' : reprojError < 2.0 ? 'var(--accent-warn)' : 'var(--accent-critical)'
                  : 'var(--text-muted)',
              },
              { label: 'Valid Points', value: numPoints > 0 ? `${numPoints}` : '—' },
              { label: 'Cameras', value: '2 (SYN)' },
              {
                label: 'Pose Quality',
                value: reprojError !== null ? (reprojError < 1.0 ? 'GOOD' : reprojError < 2.0 ? 'FAIR' : 'POOR') : '—',
                color: reprojError !== null
                  ? reprojError < 1.0 ? 'var(--accent-primary)' : reprojError < 2.0 ? 'var(--accent-warn)' : 'var(--accent-critical)'
                  : 'var(--text-muted)',
              },
              {
                label: 'Calibration',
                value: statuses.every(s => s === 'complete') ? 'COMPLETE' : `STAGE ${currentStage}/${STAGES.length}`,
                color: statuses.every(s => s === 'complete') ? 'var(--accent-primary)' : undefined,
              },
            ].map(m => (
              <div key={m.label} className="kv-row" style={{ padding: '5px 0' }}>
                <span className="kv-label">{m.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: m.color ?? 'var(--text-primary)' }}>
                  {m.value}
                </span>
              </div>
            ))}

            <div className="divider" />

            <div className="section-title" style={{ marginBottom: 8 }}>Instructions</div>
            <ul style={{
              listStyle: 'none', padding: 0,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {getInstructions(active.id).map((ins, i) => (
                <li key={i} style={{
                  fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)',
                  paddingLeft: 12, position: 'relative', lineHeight: 1.5,
                }}>
                  <span style={{ position: 'absolute', left: 0, color: 'var(--accent-teal)' }}>›</span>
                  {ins}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Stage-specific SVG visualisation ─────────────────────────────────────────
const CalibVisualization: React.FC<{ stageId: number }> = ({ stageId }) => {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(p => (p + 0.02) % (Math.PI * 2)), 50);
    return () => clearInterval(id);
  }, []);

  if (stageId === 1) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 200">
        {[100, 200, 300].map((x, i) => (
          <g key={i}>
            <rect x={x - 20} y={60} width={40} height={80} rx={3}
              fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth={1} />
            <circle cx={x} cy={100} r={10} fill="none" stroke="var(--accent-secondary)" strokeWidth={1.5} />
            <text x={x} y={175} textAnchor="middle" fill="var(--text-muted)" fontSize={9} fontFamily="monospace">
              CAM-{String(i + 1).padStart(2, '0')}
            </text>
            <circle cx={x} cy={58} r={4} fill={i < 2 ? 'var(--status-online)' : 'var(--status-offline)'} />
          </g>
        ))}
        <text x={200} y={20} textAnchor="middle" fill="var(--accent-teal)" fontSize={9} fontFamily="monospace">
          SCANNING FOR CAMERA SOURCES…
        </text>
      </svg>
    );
  }

  if (stageId === 3) {
    // Moving marker animation
    const mx = 200 + 100 * Math.cos(t);
    const my = 100 + 40 * Math.sin(t);
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 200">
        <rect width={400} height={200} fill="var(--bg-base)" />
        {Array.from({ length: 5 }, (_, i) => {
          const tt = t - i * 0.15;
          return (
            <circle key={i}
              cx={200 + 100 * Math.cos(tt)} cy={100 + 40 * Math.sin(tt)}
              r={4 - i * 0.6} fill="var(--accent-primary)" opacity={(1 - i / 5) * 0.7}
            />
          );
        })}
        <circle cx={mx} cy={my} r={5} fill="var(--accent-primary)" />
        <circle cx={mx} cy={my} r={9} fill="none" stroke="var(--accent-primary)" strokeWidth={1} opacity={0.4} />
        <text x={200} y={18} textAnchor="middle" fill="var(--accent-teal)" fontSize={9} fontFamily="monospace">
          COLLECTING MULTI-VIEW CORRESPONDENCES
        </text>
      </svg>
    );
  }

  // Default: generic grid
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 200">
      <rect width={400} height={200} fill="var(--bg-base)" />
      {[0,1,2,3,4].map(i =>
        <line key={`v${i}`} x1={i*100} y1={0} x2={i*100} y2={200} stroke="var(--border-subtle)" strokeWidth={0.5} />
      )}
      {[0,1,2,3,4].map(i =>
        <line key={`h${i}`} x1={0} y1={i*50} x2={400} y2={i*50} stroke="var(--border-subtle)" strokeWidth={0.5} />
      )}
      <text x={200} y={105} textAnchor="middle" fill="var(--text-muted)" fontSize={10} fontFamily="monospace">
        STAGE {stageId} VISUALISATION
      </text>
    </svg>
  );
};

import { useEffect } from 'react';

function getInstructions(stageId: number): string[] {
  const map: Record<number, string[]> = {
    1: ['Ensure cameras are powered on', 'Connect USB or verify pseyepy detects cameras', 'Check camera-params.json is valid'],
    2: ['Print a 9×6 chessboard pattern', 'Hold it at various angles', 'Capture at least 20 frames per camera'],
    3: ['Use a bright LED marker', 'Move slowly across the full volume', 'Capture at least 50 correspondences'],
    4: ['Uses fundamental matrix F→E decomposition', 'Four chirality candidates evaluated', 'Best R,t selected by point count'],
    5: ['Levenberg-Marquardt optimisation', 'Target reprojection error < 1.0 px', 'Cauchy loss for outlier robustness'],
    6: ['Place two markers exactly 15 cm apart', 'Triangulate both to get observed distance', 'Scale factor applied to all camera poses'],
    7: ['Move a marker across the floor plane', 'Least-squares plane fit', 'Click to set world origin point'],
    8: ['Review reprojection error per camera', 'Export calibration to camera-params.json', 'Profile saved and ready for tracking'],
  };
  return map[stageId] ?? [];
}
