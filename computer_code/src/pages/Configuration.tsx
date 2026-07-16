// AeroMocap ROS — Configuration Page
import React, { useState } from 'react';
import { socketEmit } from '@/services/socket';
import type { FilterType, SystemMode } from '@/types';

interface SectionProps { title: string; children: React.ReactNode }
const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div style={{
    background: 'var(--bg-panel)', border: '1px solid var(--border)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', marginBottom: 16,
  }}>
    <div className="panel-header">{title}</div>
    <div style={{ padding: '14px 16px' }}>{children}</div>
  </div>
);

interface FieldProps {
  label: string; hint?: string;
  children: React.ReactNode;
}
const Field: React.FC<FieldProps> = ({ label, hint, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
    <div style={{ flex: '0 0 200px' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)' }}>{label}</div>
      {hint && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{hint}</div>}
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-base)',
  border: '1px solid var(--border)', borderRadius: 'var(--border-radius)',
  padding: '6px 10px', color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

export const Configuration: React.FC = () => {
  const [mode, setMode]           = useState<SystemMode>('simulation');
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');
  const [defaultFps, setDefaultFps] = useState(60);
  const [resolution, setResolution] = useState('640x480');
  const [filter, setFilter]       = useState<FilterType>('kalman');
  const [markerType, setMarkerType] = useState('led');
  const [threshold, setThreshold] = useState(51);
  const [ros2Enabled, setRos2Enabled] = useState(false);
  const [topicPrefix, setTopicPrefix] = useState('/aeromocap');
  const [frameId, setFrameId]     = useState('map');
  const [rosRate, setRosRate]     = useState(30);
  const [px4Enabled, setPx4Enabled] = useState(false);
  const [saved, setSaved]         = useState(false);

  const handleSave = () => {
    socketEmit.setFilter(filter);
    socketEmit.setMode(mode);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggle = (val: boolean, setter: (v: boolean) => void) => (
    <button
      onClick={() => setter(!val)}
      style={{
        padding: '5px 16px',
        background: val ? 'rgba(139,255,77,0.12)' : 'var(--bg-base)',
        border: `1px solid ${val ? 'rgba(139,255,77,0.4)' : 'var(--border)'}`,
        borderRadius: 'var(--border-radius)', cursor: 'pointer',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: val ? 'var(--accent-primary)' : 'var(--text-muted)',
        transition: 'var(--transition-fast)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
        background: val ? 'var(--accent-primary)' : 'var(--text-muted)',
      }} />
      {val ? 'ENABLED' : 'DISABLED'}
    </button>
  );

  return (
    <div className="page-enter" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
              System Configuration
            </h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              Changes apply immediately where possible. Some require backend restart.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-primary)' }}>
                ✓ Saved
              </span>
            )}
            <button id="btn-save-config" className="btn btn-primary" onClick={handleSave}>
              Save Configuration
            </button>
          </div>
        </div>

        {/* ── General ── */}
        <Section title="General">
          <Field label="Operating Mode" hint="Requires backend restart to change">
            <select value={mode} onChange={e => setMode(e.target.value as SystemMode)} style={selectStyle}>
              <option value="simulation">Simulation — No cameras required</option>
              <option value="video">Video — Prerecorded files</option>
              <option value="live">Live — Physical cameras</option>
            </select>
          </Field>
          <Field label="Backend URL" hint="Socket.IO + REST API base URL">
            <input value={backendUrl} onChange={e => setBackendUrl(e.target.value)} style={inputStyle} />
          </Field>
        </Section>

        {/* ── Cameras ── */}
        <Section title="Cameras">
          <Field label="Default Source Type">
            <select style={selectStyle} defaultValue="synthetic">
              <option value="synthetic">Synthetic (Simulation)</option>
              <option value="ps3eye">PS3 Eye</option>
              <option value="usb">USB Webcam</option>
              <option value="video_file">Video File</option>
            </select>
          </Field>
          <Field label="Default FPS" hint="Frames per second per camera">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="range" min={15} max={120} value={defaultFps}
                onChange={e => setDefaultFps(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-primary)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', minWidth: 40 }}>
                {defaultFps} Hz
              </span>
            </div>
          </Field>
          <Field label="Default Resolution">
            <select value={resolution} onChange={e => setResolution(e.target.value)} style={selectStyle}>
              <option value="320x240">320 × 240</option>
              <option value="640x480">640 × 480</option>
              <option value="1280x720">1280 × 720</option>
            </select>
          </Field>
        </Section>

        {/* ── Tracking ── */}
        <Section title="Tracking">
          <Field label="Marker Detector">
            <select value={markerType} onChange={e => setMarkerType(e.target.value)} style={selectStyle}>
              <option value="led">LED Marker (Brightness threshold)</option>
              <option value="aruco">ArUco Pattern</option>
              <option value="chessboard">Chessboard</option>
            </select>
          </Field>
          <Field label="Detection Threshold" hint="Brightness threshold (0–255) for LED detection">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="range" min={0} max={255} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-primary)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minWidth: 28 }}>{threshold}</span>
            </div>
          </Field>
        </Section>

        {/* ── Filtering ── */}
        <Section title="Pose Filtering">
          <Field label="Active Filter" hint="Applied to tracked object positions">
            <div style={{ display: 'flex', gap: 8 }}>
              {(['none', 'lowpass', 'kalman'] as FilterType[]).map(f => (
                <button key={f}
                  className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                  onClick={() => setFilter(f)}>
                  {f === 'kalman' ? '⟳ Kalman' : f === 'lowpass' ? '∿ Low-Pass' : '○ None'}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* ── ROS 2 ── */}
        <Section title="ROS 2 Bridge">
          <Field label="Enable ROS 2">{toggle(ros2Enabled, setRos2Enabled)}</Field>
          <Field label="Topic Prefix" hint="e.g. /aeromocap">
            <input value={topicPrefix} onChange={e => setTopicPrefix(e.target.value)} style={inputStyle} disabled={!ros2Enabled} />
          </Field>
          <Field label="World Frame ID" hint="TF fixed frame">
            <input value={frameId} onChange={e => setFrameId(e.target.value)} style={inputStyle} disabled={!ros2Enabled} />
          </Field>
          <Field label="Publish Rate (Hz)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="range" min={1} max={100} value={rosRate}
                onChange={e => setRosRate(Number(e.target.value))}
                disabled={!ros2Enabled}
                style={{ flex: 1, accentColor: 'var(--accent-primary)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minWidth: 28 }}>{rosRate}</span>
            </div>
          </Field>
        </Section>

        {/* ── PX4 ── */}
        <Section title="PX4 Integration (Experimental)">
          <Field label="Enable PX4">{toggle(px4Enabled, setPx4Enabled)}</Field>
          <Field label="Serial Port" hint="Not available — Phase 12">
            <input value="/dev/ttyUSB0" style={{ ...inputStyle, opacity: 0.4 }} disabled />
          </Field>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            PX4 integration is planned for Phase 12. Configuration fields will be active then.
          </p>
        </Section>
      </div>
    </div>
  );
};
