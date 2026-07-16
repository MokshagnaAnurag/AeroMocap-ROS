// AeroMocap ROS — PX4 Link Page (Experimental)
import React from 'react';

export const PX4Link: React.FC = () => (
  <div className="page-enter" style={{ height: '100%', overflowY: 'auto', padding: 24 }}>

    {/* ── Experimental Banner ── */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
      padding: '10px 16px',
      background: 'rgba(167,139,250,0.08)',
      border: '1px solid rgba(167,139,250,0.3)',
      borderRadius: 'var(--border-radius-lg)',
    }}>
      <span style={{ fontSize: 18 }}>◇</span>
      <div>
        <div style={{
          fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14,
          color: 'var(--accent-purple)',
        }}>
          PX4 External Vision — EXPERIMENTAL
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
          Phase 12 — Not yet implemented. Architectural scaffold only.
        </div>
      </div>
      <span style={{
        marginLeft: 'auto',
        fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 10px',
        background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
        borderRadius: 2, color: 'var(--accent-purple)', letterSpacing: '0.06em',
      }}>
        BETA
      </span>
    </div>

    {/* ── Overview ── */}
    <div style={{ maxWidth: 640, marginBottom: 24 }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
        PX4 External Vision Integration
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12 }}>
        When enabled, AeroMocap ROS will convert tracked PoseStamped messages into PX4-compatible
        <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', margin: '0 4px' }}>VehicleOdometry</code>
        messages and publish them over MAVLink / MAVSDK for GPS-denied flight.
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        This is not mandatory for AeroMocap ROS to function. Mocap tracking and ROS 2 publishing work
        independently. PX4 integration is purely additive and gated behind a config flag.
      </p>
    </div>

    {/* ── Architecture ── */}
    <div style={{ marginBottom: 24 }}>
      <div className="section-title" style={{ marginBottom: 10 }}>Planned Data Flow</div>
      <div style={{
        background: 'var(--bg-panel)', border: '1px solid var(--border)',
        borderRadius: 'var(--border-radius)', padding: '16px 20px',
        fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 2.2,
        color: 'var(--text-secondary)',
      }}>
        <div>AeroMocap Tracking Engine</div>
        <div style={{ paddingLeft: 20 }}>
          <span style={{ color: 'var(--text-muted)' }}>↓ </span>
          <span style={{ color: 'var(--accent-secondary)' }}>geometry_msgs/PoseStamped</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}> (ROS 2 topic)</span>
        </div>
        <div style={{ paddingLeft: 20 }}>
          <span style={{ color: 'var(--text-muted)' }}>↓ </span>
          <span style={{ color: 'var(--accent-purple)' }}>PX4Bridge.publish_odometry()</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}> (coordinate transform)</span>
        </div>
        <div style={{ paddingLeft: 20 }}>
          <span style={{ color: 'var(--text-muted)' }}>↓ </span>
          <span style={{ color: 'var(--accent-warn)' }}>px4_msgs/VehicleOdometry</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}> (uXRCE-DDS / MAVSDK)</span>
        </div>
        <div style={{ paddingLeft: 20 }}>
          <span style={{ color: 'var(--text-muted)' }}>↓ </span>
          <span style={{ color: 'var(--accent-critical)' }}>PX4 Flight Controller</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}> (EKF2 external vision)</span>
        </div>
      </div>
    </div>

    {/* ── Config (disabled) ── */}
    <div style={{ maxWidth: 400 }}>
      <div className="section-title" style={{ marginBottom: 10 }}>Configuration (Inactive)</div>
      <div style={{
        background: 'var(--bg-panel)', border: '1px solid var(--border)',
        borderRadius: 'var(--border-radius)', padding: 16, opacity: 0.5,
        pointerEvents: 'none',
      }}>
        {[
          { label: 'Enable PX4 Bridge', value: 'false (disabled)' },
          { label: 'Serial Port',       value: '/dev/ttyUSB0' },
          { label: 'Baud Rate',         value: '921600' },
          { label: 'MAVLink Version',   value: '2' },
          { label: 'Vehicle ID',        value: '1' },
          { label: 'Frame convention',  value: 'NED' },
        ].map(r => (
          <div key={r.label} className="kv-row" style={{ padding: '5px 0' }}>
            <span className="kv-label">{r.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{r.value}</span>
          </div>
        ))}
      </div>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
        marginTop: 10, lineHeight: 1.6,
      }}>
        Enable in config.yaml → px4.enabled: true<br />
        Requires: px4_msgs, MAVSDK, PX4 running uXRCE-DDS
      </p>
    </div>
  </div>
);
