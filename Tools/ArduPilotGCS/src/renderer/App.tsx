import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MapView from './pages/MapView';
import FlightData from './pages/FlightData';
import Parameters from './pages/Parameters';
import Settings from './pages/Settings';
import { useDroneStore } from './store/droneStore';
import { useMissionStore } from './store/missionStore';

declare global {
  interface Window {
    electronAPI: {
      settings: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<void>;
        getAll: () => Promise<unknown>;
      };
      mavlink: {
        connect: (type: string, params: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
        disconnect: () => Promise<{ success: boolean }>;
        isConnected: () => Promise<boolean>;
        sendCommand: (cmd: string, params: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
        getSerialPorts: () => Promise<Array<{ path: string; manufacturer?: string }>>;
        onTelemetry: (cb: (data: unknown) => void) => () => void;
        onHeartbeat: (cb: (data: unknown) => void) => () => void;
        onAttitude: (cb: (data: unknown) => void) => () => void;
        onGpsRaw: (cb: (data: unknown) => void) => () => void;
        onGlobalPosition: (cb: (data: unknown) => void) => () => void;
        onBatteryStatus: (cb: (data: unknown) => void) => () => void;
        onVfrHud: (cb: (data: unknown) => void) => () => void;
        onSysStatus: (cb: (data: unknown) => void) => () => void;
        onStatusText: (cb: (data: unknown) => void) => () => void;
        onConnectionStatus: (cb: (data: { connected: boolean }) => void) => () => void;
        onMissionProgress: (cb: (data: unknown) => void) => () => void;
      };
      mission: {
        upload: (waypoints: unknown[]) => Promise<{ success: boolean; error?: string }>;
        download: () => Promise<{ success: boolean; mission?: unknown[]; error?: string }>;
        clear: () => Promise<{ success: boolean }>;
        loadFromFile: (path: string) => Promise<{ success: boolean; mission?: unknown[]; error?: string }>;
        saveToFile: (path: string, waypoints: unknown[]) => Promise<{ success: boolean }>;
      };
      dialog: {
        showMessage: (options: unknown) => Promise<unknown>;
      };
      onMenuEvent: (channel: string, cb: (data?: unknown) => void) => () => void;
    };
  }
}

const App: React.FC = () => {
  const { setConnected, updateTelemetry, updatePosition, updateBattery, addMessage, updateHeartbeat, updateVfrHud } = useDroneStore();
  const { setCurrentWaypoint, loadMission, clearMission } = useMissionStore();

  useEffect(() => {
    // Set up MAVLink event listeners
    const unsubscribers: (() => void)[] = [];

    if (window.electronAPI) {
      unsubscribers.push(
        window.electronAPI.mavlink.onConnectionStatus((data) => {
          setConnected(data.connected);
        })
      );

      unsubscribers.push(
        window.electronAPI.mavlink.onAttitude((data: any) => {
          updateTelemetry({
            roll: (data.roll * 180) / Math.PI,
            pitch: (data.pitch * 180) / Math.PI,
            yaw: (data.yaw * 180) / Math.PI,
          });
        })
      );

      unsubscribers.push(
        window.electronAPI.mavlink.onGlobalPosition((data: any) => {
          updatePosition({
            lat: data.lat,
            lon: data.lon,
            alt: data.relative_alt,
            heading: data.hdg,
          });
        })
      );

      unsubscribers.push(
        window.electronAPI.mavlink.onBatteryStatus((data: any) => {
          updateBattery({
            voltage: data.voltage,
            current: data.current,
            remaining: data.remaining,
          });
        })
      );

      unsubscribers.push(
        window.electronAPI.mavlink.onHeartbeat((data: any) => {
          updateHeartbeat(data);
        })
      );

      unsubscribers.push(
        window.electronAPI.mavlink.onVfrHud((data: any) => {
          updateVfrHud(data);
        })
      );

      unsubscribers.push(
        window.electronAPI.mavlink.onStatusText((data: any) => {
          addMessage({
            severity: data.severityLabel,
            text: data.text,
            timestamp: new Date(),
          });
        })
      );

      unsubscribers.push(
        window.electronAPI.mavlink.onMissionProgress((data: any) => {
          setCurrentWaypoint(data.currentWaypoint);
        })
      );

      // Menu event handlers
      unsubscribers.push(
        window.electronAPI.onMenuEvent('menu:new-mission', () => {
          clearMission();
        })
      );

      unsubscribers.push(
        window.electronAPI.onMenuEvent('menu:open-mission', async (filePath) => {
          if (typeof filePath === 'string') {
            const result = await window.electronAPI.mission.loadFromFile(filePath);
            if (result.success && result.mission) {
              loadMission(result.mission as any[]);
            }
          }
        })
      );
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MapView />} />
          <Route path="flight-data" element={<FlightData />} />
          <Route path="parameters" element={<Parameters />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
