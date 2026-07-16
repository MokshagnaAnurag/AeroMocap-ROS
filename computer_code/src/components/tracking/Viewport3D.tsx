// AeroMocap ROS — 3D Tracking Viewport
// react-three-fiber scene: floor grid, axes, trajectory trail, object markers, camera frustums

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import type { TelemetryState } from '@/hooks/useTelemetry';

// ── Object Marker ─────────────────────────────────────────────────────────────
const ObjectMarker: React.FC<{ pos: [number, number, number]; label: string }> = ({ pos, label }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [x, y, z] = pos;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.set(x, z, -y); // remap: ROS z-up → THREE y-up
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.06, 0]} />
        <meshStandardMaterial
          color="#8BFF4D"
          emissive="#8BFF4D"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
      {/* Vertical drop line */}
      <line>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([x, 0, -y, x, z, -y]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="#8BFF4D" opacity={0.25} transparent />
      </line>
    </group>
  );
};

// ── Trajectory Trail ──────────────────────────────────────────────────────────
const TrajectoryTrail: React.FC<{ trail: [number, number, number][] }> = ({ trail }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    if (trail.length < 2) return geo;
    // Remap: ROS (x,y,z) → THREE (x,z,-y)
    const pts = trail.map(([x, y, z]) => new THREE.Vector3(x, z, -y));
    geo.setFromPoints(pts);
    return geo;
  }, [trail]);

  if (trail.length < 2) return null;

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#4DC8FF" opacity={0.55} transparent linewidth={1.5} />
    </line>
  );
};

// ── Synthetic Camera Frustum ──────────────────────────────────────────────────
const CameraFrustum: React.FC<{ position: [number,number,number]; rotation: [number,number,number]; label: string }> = ({ position, rotation, label }) => (
  <group position={position} rotation={rotation}>
    <mesh>
      <coneGeometry args={[0.08, 0.15, 4]} />
      <meshBasicMaterial color="#4DC8FF" opacity={0.3} transparent wireframe />
    </mesh>
  </group>
);

// ── Scene ─────────────────────────────────────────────────────────────────────
const Scene: React.FC<{ telemetry: TelemetryState }> = ({ telemetry }) => {
  const { filteredObjects, trail } = telemetry;
  const primary = filteredObjects[0];

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#4DC8FF" />

      {/* Floor grid */}
      <Grid
        args={[8, 8]}
        cellSize={0.5}
        cellThickness={0.3}
        cellColor="#1A2333"
        sectionSize={2}
        sectionThickness={0.8}
        sectionColor="#263241"
        fadeDistance={20}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* World origin axes (XYZ) */}
      <axesHelper args={[0.5]} />

      {/* Synthetic camera positions */}
      <CameraFrustum position={[-1.5, 1.2, -1.5]} rotation={[0.3, 0.7, 0]}  label="CAM-01" />
      <CameraFrustum position={[ 1.5, 1.2, -1.5]} rotation={[0.3, -0.7, 0]} label="CAM-02" />

      {/* Trajectory trail */}
      <TrajectoryTrail trail={trail} />

      {/* Tracked objects */}
      {primary && (
        <ObjectMarker
          pos={primary.pos as [number, number, number]}
          label={`OBJ-${primary.object_id ?? 0}`}
        />
      )}

      {/* Orbit controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        makeDefault
        minDistance={0.5}
        maxDistance={20}
        target={[0, 1, 0]}
      />

      {/* Gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport
          axisColors={['#FF5C5C', '#8BFF4D', '#4DC8FF']}
          labelColor="#EDF4F8"
        />
      </GizmoHelper>
    </>
  );
};

// ── Viewport3D ────────────────────────────────────────────────────────────────
interface Viewport3DProps {
  telemetry: TelemetryState;
  style?: React.CSSProperties;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({ telemetry, style }) => (
  <div style={{
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--border-radius)',
    overflow: 'hidden',
    position: 'relative',
    ...style,
  }}>
    {/* Corner label */}
    <div style={{
      position: 'absolute', top: 8, left: 10, zIndex: 5,
      fontFamily: 'var(--font-mono)', fontSize: 9,
      color: 'var(--text-muted)', letterSpacing: '0.08em',
      textTransform: 'uppercase', pointerEvents: 'none',
    }}>
      TRACK SPACE · WORLD FRAME
    </div>

    {/* Object count */}
    <div style={{
      position: 'absolute', top: 8, right: 10, zIndex: 5,
      fontFamily: 'var(--font-mono)', fontSize: 9,
      color: telemetry.filteredObjects.length > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
      letterSpacing: '0.06em',
      pointerEvents: 'none',
    }}>
      {telemetry.filteredObjects.length > 0
        ? `${telemetry.filteredObjects.length} OBJ TRACKED`
        : 'NO OBJECTS'}
    </div>

    <Canvas
      camera={{ position: [3, 2.5, 3], fov: 55, near: 0.01, far: 100 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#080B0F']} />
      <fog attach="fog" args={['#080B0F', 12, 30]} />
      <Scene telemetry={telemetry} />
    </Canvas>
  </div>
);
