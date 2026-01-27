import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Map,
  Gauge,
  Palette,
  Bell,
  HardDrive,
  Info,
} from 'lucide-react';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: SettingsSection[] = [
  { id: 'general', label: 'General', icon: <SettingsIcon className="w-5 h-5" /> },
  { id: 'map', label: 'Map', icon: <Map className="w-5 h-5" /> },
  { id: 'units', label: 'Units', icon: <Gauge className="w-5 h-5" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { id: 'data', label: 'Data & Storage', icon: <HardDrive className="w-5 h-5" /> },
  { id: 'about', label: 'About', icon: <Info className="w-5 h-5" /> },
];

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    // General
    autoConnect: false,
    lastConnectionType: 'udp',
    defaultAltitude: 50,
    defaultSpeed: 5,

    // Map
    mapProvider: 'osm',
    defaultLat: 37.7749,
    defaultLon: -122.4194,
    defaultZoom: 15,
    showGrid: true,
    showScale: true,

    // Units
    altitudeUnit: 'meters',
    speedUnit: 'm/s',
    distanceUnit: 'meters',
    temperatureUnit: 'celsius',

    // Appearance
    theme: 'dark',
    compactMode: false,
    showTelemetryOverlay: true,
    showMessageLog: true,

    // Notifications
    soundEnabled: true,
    lowBatteryWarning: 20,
    gpsLossWarning: true,
    connectionLossWarning: true,

    // Data
    logFlightData: true,
    logLocation: '',
    autoSaveMissions: true,
  });

  const updateSetting = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // In a real app, save to electron-store
    if (window.electronAPI) {
      window.electronAPI.settings.set(key, value);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <SettingGroup title="Connection">
              <SettingToggle
                label="Auto-connect on startup"
                description="Automatically connect to the last used connection"
                checked={settings.autoConnect}
                onChange={(v) => updateSetting('autoConnect', v)}
              />
            </SettingGroup>

            <SettingGroup title="Mission Defaults">
              <SettingInput
                label="Default Altitude"
                description="Default altitude for new waypoints"
                type="number"
                value={settings.defaultAltitude}
                onChange={(v) => updateSetting('defaultAltitude', v)}
                suffix="m"
              />
              <SettingInput
                label="Default Speed"
                description="Default speed for auto mode"
                type="number"
                value={settings.defaultSpeed}
                onChange={(v) => updateSetting('defaultSpeed', v)}
                suffix="m/s"
              />
            </SettingGroup>
          </div>
        );

      case 'map':
        return (
          <div className="space-y-6">
            <SettingGroup title="Map Provider">
              <SettingSelect
                label="Map Tiles"
                description="Choose the map tile provider"
                value={settings.mapProvider}
                onChange={(v) => updateSetting('mapProvider', v)}
                options={[
                  { value: 'osm', label: 'OpenStreetMap' },
                  { value: 'satellite', label: 'Satellite (Google)' },
                  { value: 'terrain', label: 'Terrain' },
                ]}
              />
            </SettingGroup>

            <SettingGroup title="Default Location">
              <div className="grid grid-cols-2 gap-4">
                <SettingInput
                  label="Latitude"
                  type="number"
                  value={settings.defaultLat}
                  onChange={(v) => updateSetting('defaultLat', v)}
                />
                <SettingInput
                  label="Longitude"
                  type="number"
                  value={settings.defaultLon}
                  onChange={(v) => updateSetting('defaultLon', v)}
                />
              </div>
              <SettingInput
                label="Default Zoom"
                type="number"
                value={settings.defaultZoom}
                onChange={(v) => updateSetting('defaultZoom', v)}
                min={1}
                max={20}
              />
            </SettingGroup>

            <SettingGroup title="Display Options">
              <SettingToggle
                label="Show Grid"
                checked={settings.showGrid}
                onChange={(v) => updateSetting('showGrid', v)}
              />
              <SettingToggle
                label="Show Scale"
                checked={settings.showScale}
                onChange={(v) => updateSetting('showScale', v)}
              />
            </SettingGroup>
          </div>
        );

      case 'units':
        return (
          <div className="space-y-6">
            <SettingGroup title="Measurement Units">
              <SettingSelect
                label="Altitude"
                value={settings.altitudeUnit}
                onChange={(v) => updateSetting('altitudeUnit', v)}
                options={[
                  { value: 'meters', label: 'Meters (m)' },
                  { value: 'feet', label: 'Feet (ft)' },
                ]}
              />
              <SettingSelect
                label="Speed"
                value={settings.speedUnit}
                onChange={(v) => updateSetting('speedUnit', v)}
                options={[
                  { value: 'm/s', label: 'Meters/second (m/s)' },
                  { value: 'km/h', label: 'Kilometers/hour (km/h)' },
                  { value: 'mph', label: 'Miles/hour (mph)' },
                  { value: 'knots', label: 'Knots (kn)' },
                ]}
              />
              <SettingSelect
                label="Distance"
                value={settings.distanceUnit}
                onChange={(v) => updateSetting('distanceUnit', v)}
                options={[
                  { value: 'meters', label: 'Meters (m)' },
                  { value: 'feet', label: 'Feet (ft)' },
                  { value: 'kilometers', label: 'Kilometers (km)' },
                  { value: 'miles', label: 'Miles (mi)' },
                ]}
              />
              <SettingSelect
                label="Temperature"
                value={settings.temperatureUnit}
                onChange={(v) => updateSetting('temperatureUnit', v)}
                options={[
                  { value: 'celsius', label: 'Celsius (°C)' },
                  { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
                ]}
              />
            </SettingGroup>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <SettingGroup title="Theme">
              <SettingSelect
                label="Color Theme"
                value={settings.theme}
                onChange={(v) => updateSetting('theme', v)}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'system', label: 'System' },
                ]}
              />
            </SettingGroup>

            <SettingGroup title="Layout">
              <SettingToggle
                label="Compact Mode"
                description="Use smaller UI elements"
                checked={settings.compactMode}
                onChange={(v) => updateSetting('compactMode', v)}
              />
              <SettingToggle
                label="Show Telemetry Overlay"
                description="Show telemetry data on the map"
                checked={settings.showTelemetryOverlay}
                onChange={(v) => updateSetting('showTelemetryOverlay', v)}
              />
              <SettingToggle
                label="Show Message Log"
                description="Show vehicle messages panel"
                checked={settings.showMessageLog}
                onChange={(v) => updateSetting('showMessageLog', v)}
              />
            </SettingGroup>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <SettingGroup title="Audio">
              <SettingToggle
                label="Sound Effects"
                description="Play sounds for events and warnings"
                checked={settings.soundEnabled}
                onChange={(v) => updateSetting('soundEnabled', v)}
              />
            </SettingGroup>

            <SettingGroup title="Warnings">
              <SettingInput
                label="Low Battery Warning"
                description="Warn when battery falls below this percentage"
                type="number"
                value={settings.lowBatteryWarning}
                onChange={(v) => updateSetting('lowBatteryWarning', v)}
                suffix="%"
                min={5}
                max={50}
              />
              <SettingToggle
                label="GPS Loss Warning"
                description="Warn when GPS signal is lost"
                checked={settings.gpsLossWarning}
                onChange={(v) => updateSetting('gpsLossWarning', v)}
              />
              <SettingToggle
                label="Connection Loss Warning"
                description="Warn when vehicle connection is lost"
                checked={settings.connectionLossWarning}
                onChange={(v) => updateSetting('connectionLossWarning', v)}
              />
            </SettingGroup>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <SettingGroup title="Flight Logs">
              <SettingToggle
                label="Log Flight Data"
                description="Automatically save telemetry data during flights"
                checked={settings.logFlightData}
                onChange={(v) => updateSetting('logFlightData', v)}
              />
            </SettingGroup>

            <SettingGroup title="Missions">
              <SettingToggle
                label="Auto-save Missions"
                description="Automatically save mission changes"
                checked={settings.autoSaveMissions}
                onChange={(v) => updateSetting('autoSaveMissions', v)}
              />
            </SettingGroup>

            <SettingGroup title="Storage">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Flight Logs</span>
                  <span className="text-sm">0 MB</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Saved Missions</span>
                  <span className="text-sm">0 MB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Map Cache</span>
                  <span className="text-sm">0 MB</span>
                </div>
                <button className="btn btn-ghost w-full mt-4">Clear All Data</button>
              </div>
            </SettingGroup>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-sky-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SettingsIcon className="w-10 h-10 text-sky-400" />
              </div>
              <h2 className="text-2xl font-bold">ArduPilot GCS</h2>
              <p className="text-slate-400 mt-1">Version 1.0.0</p>
            </div>

            <SettingGroup title="Information">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Electron</span>
                  <span>28.2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">React</span>
                  <span>18.2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Node.js</span>
                  <span>18.x</span>
                </div>
              </div>
            </SettingGroup>

            <SettingGroup title="Links">
              <div className="space-y-2">
                <a
                  href="#"
                  onClick={() => require('electron').shell.openExternal('https://ardupilot.org')}
                  className="block text-sky-400 hover:text-sky-300"
                >
                  ArduPilot Documentation
                </a>
                <a
                  href="#"
                  onClick={() => require('electron').shell.openExternal('https://github.com/ArduPilot/ardupilot')}
                  className="block text-sky-400 hover:text-sky-300"
                >
                  GitHub Repository
                </a>
                <a
                  href="#"
                  onClick={() => require('electron').shell.openExternal('https://discuss.ardupilot.org')}
                  className="block text-sky-400 hover:text-sky-300"
                >
                  Community Forum
                </a>
              </div>
            </SettingGroup>

            <div className="text-center text-sm text-slate-500">
              <p>Licensed under GPL-3.0</p>
              <p className="mt-1">Made with love by the ArduPilot Community</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-56 bg-slate-800 border-r border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
        <nav className="py-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeSection === section.id
                  ? 'bg-sky-600/20 text-sky-400 border-l-2 border-sky-500'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {section.icon}
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">{renderSection()}</div>
      </div>
    </div>
  );
};

// Setting Components
interface SettingGroupProps {
  title: string;
  children: React.ReactNode;
}

const SettingGroup: React.FC<SettingGroupProps> = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  checked,
  onChange,
}) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="font-medium">{label}</div>
      {description && <div className="text-sm text-slate-400">{description}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-sky-600' : 'bg-slate-600'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

interface SettingInputProps {
  label: string;
  description?: string;
  type: 'text' | 'number';
  value: string | number;
  onChange: (value: string | number) => void;
  suffix?: string;
  min?: number;
  max?: number;
}

const SettingInput: React.FC<SettingInputProps> = ({
  label,
  description,
  type,
  value,
  onChange,
  suffix,
  min,
  max,
}) => (
  <div>
    <div className="font-medium mb-1">{label}</div>
    {description && <div className="text-sm text-slate-400 mb-2">{description}</div>}
    <div className="flex items-center gap-2">
      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)
        }
        className="input flex-1"
        min={min}
        max={max}
      />
      {suffix && <span className="text-slate-400">{suffix}</span>}
    </div>
  </div>
);

interface SettingSelectProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

const SettingSelect: React.FC<SettingSelectProps> = ({
  label,
  description,
  value,
  onChange,
  options,
}) => (
  <div>
    <div className="font-medium mb-1">{label}</div>
    {description && <div className="text-sm text-slate-400 mb-2">{description}</div>}
    <select value={value} onChange={(e) => onChange(e.target.value)} className="select w-full">
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export default Settings;
