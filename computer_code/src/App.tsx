// AeroMocap ROS — Root Application Shell
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { MissionControl } from '@/pages/MissionControl';
import { VisionArray } from '@/pages/VisionArray';
import { CalibrationLab } from '@/pages/CalibrationLab';
import { TrackSpace } from '@/pages/TrackSpace';
import { ROSBridge } from '@/pages/ROSBridge';
import { PX4Link } from '@/pages/PX4Link';
import { Diagnostics } from '@/pages/Diagnostics';
import { Configuration } from '@/pages/Configuration';
import type { NavPage } from '@/types';

const PAGE_TITLES: Record<NavPage, string> = {
  'mission-control': 'Mission Control',
  'vision-array':    'Vision Array',
  'calibration-lab': 'Calibration Lab',
  'track-space':     'Track Space',
  'ros-bridge':      'ROS Bridge',
  'px4-link':        'PX4 Link',
  'diagnostics':     'System Diagnostics',
  'configuration':   'Configuration',
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavPage>('mission-control');
  const health = useSystemHealth();

  const renderPage = () => {
    switch (activePage) {
      case 'mission-control': return <MissionControl />;
      case 'vision-array':    return <VisionArray />;
      case 'calibration-lab': return <CalibrationLab />;
      case 'track-space':     return <TrackSpace />;
      case 'ros-bridge':      return <ROSBridge />;
      case 'px4-link':        return <PX4Link />;
      case 'diagnostics':     return <Diagnostics />;
      case 'configuration':   return <Configuration />;
      default:                return <MissionControl />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      {/* ── Sidebar Navigation ── */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        health={health}
      />

      {/* ── Main Content Area ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        {/* ── Top Bar ── */}
        <TopBar pageTitle={PAGE_TITLES[activePage]} health={health} />

        {/* ── Page Content ── */}
        <main style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
