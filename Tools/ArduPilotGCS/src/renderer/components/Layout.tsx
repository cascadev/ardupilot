import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useDroneStore } from '../store/droneStore';
import ConnectionDialog from './ConnectionDialog';
import {
  Map,
  Activity,
  Settings as SettingsIcon,
  Sliders,
  Wifi,
  WifiOff,
  Battery,
  Satellite,
  ChevronLeft,
  ChevronRight,
  Plane,
} from 'lucide-react';

const Layout: React.FC = () => {
  const { connected, armed, mode, battery, gpsFixType, satelliteCount } = useDroneStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);

  const navItems = [
    { path: '/', icon: Map, label: 'Mission Planner' },
    { path: '/flight-data', icon: Activity, label: 'Flight Data' },
    { path: '/parameters', icon: Sliders, label: 'Parameters' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const getBatteryColor = () => {
    if (battery.remaining > 50) return 'text-green-500';
    if (battery.remaining > 20) return 'text-amber-500';
    return 'text-red-500';
  };

  const getGpsIcon = () => {
    if (gpsFixType >= 3) return 'text-green-500';
    if (gpsFixType >= 2) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Top Bar */}
      <header className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-sky-500" />
            <span className="font-semibold text-lg">ArduPilot GCS</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* GPS Status */}
          <div className="flex items-center gap-2">
            <Satellite className={`w-4 h-4 ${getGpsIcon()}`} />
            <span className="text-sm text-slate-300">
              {gpsFixType >= 3 ? '3D Fix' : gpsFixType >= 2 ? '2D Fix' : 'No Fix'}
              {satelliteCount > 0 && ` (${satelliteCount})`}
            </span>
          </div>

          {/* Battery Status */}
          <div className="flex items-center gap-2">
            <Battery className={`w-4 h-4 ${getBatteryColor()}`} />
            <span className="text-sm text-slate-300">
              {battery.voltage.toFixed(1)}V
              {battery.remaining > 0 && ` ${battery.remaining}%`}
            </span>
          </div>

          {/* Flight Mode */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            armed ? 'bg-green-600/20 text-green-400 border border-green-600' : 'bg-slate-700 text-slate-300'
          }`}>
            {armed ? 'ARMED' : 'DISARMED'} - {mode}
          </div>

          {/* Connection Status */}
          <button
            onClick={() => setShowConnectionDialog(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              connected
                ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {connected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Disconnected</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-56'
          }`}
        >
          <nav className="flex-1 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-400'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-4 border-t border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* Connection Dialog */}
      {showConnectionDialog && (
        <ConnectionDialog onClose={() => setShowConnectionDialog(false)} />
      )}
    </div>
  );
};

export default Layout;
