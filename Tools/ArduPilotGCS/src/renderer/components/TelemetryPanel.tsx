import React from 'react';
import { useDroneStore } from '../store/droneStore';
import {
  Navigation,
  Gauge,
  ArrowUp,
  RotateCw,
  Compass,
} from 'lucide-react';

const TelemetryPanel: React.FC = () => {
  const { connected, position, attitude, vfrHud, battery } = useDroneStore();

  if (!connected) {
    return (
      <div className="glass-panel p-4 w-64">
        <div className="text-center text-slate-400">
          <p className="text-sm">Not connected</p>
          <p className="text-xs mt-1">Connect to vehicle to see telemetry</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 w-72">
      {/* Artificial Horizon */}
      <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-100"
          style={{
            background: `linear-gradient(to bottom,
              #3b82f6 0%,
              #3b82f6 ${50 - attitude.pitch}%,
              #854d0e ${50 - attitude.pitch}%,
              #854d0e 100%)`,
            transform: `rotate(${-attitude.roll}deg)`,
            transformOrigin: 'center',
          }}
        />
        {/* Center crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-0.5 bg-yellow-400" />
          <div className="absolute w-4 h-4 border-2 border-yellow-400 rounded-full" />
        </div>
        {/* Roll indicator */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-xs">
          {attitude.roll.toFixed(1)}°
        </div>
        {/* Pitch indicator */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs">
          {attitude.pitch.toFixed(1)}°
        </div>
      </div>

      {/* Compass */}
      <div className="relative w-full h-12 mb-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <Compass className="w-8 h-8 text-slate-400" />
        </div>
        <div
          className="absolute"
          style={{ transform: `rotate(${-position.heading}deg)` }}
        >
          <Navigation className="w-6 h-6 text-sky-400" />
        </div>
        <div className="absolute right-0 text-sm font-mono">
          {position.heading.toFixed(0)}°
        </div>
      </div>

      {/* Telemetry Values Grid */}
      <div className="grid grid-cols-2 gap-3">
        <TelemetryItem
          icon={<ArrowUp className="w-4 h-4" />}
          label="Altitude"
          value={position.alt.toFixed(1)}
          unit="m"
        />
        <TelemetryItem
          icon={<Gauge className="w-4 h-4" />}
          label="Speed"
          value={vfrHud.groundspeed.toFixed(1)}
          unit="m/s"
        />
        <TelemetryItem
          icon={<RotateCw className="w-4 h-4" />}
          label="Climb"
          value={vfrHud.climb.toFixed(1)}
          unit="m/s"
        />
        <TelemetryItem
          icon={<Gauge className="w-4 h-4" />}
          label="Throttle"
          value={vfrHud.throttle.toString()}
          unit="%"
        />
      </div>

      {/* Battery Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Battery</span>
          <span>{battery.voltage.toFixed(1)}V / {battery.remaining}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              battery.remaining > 50
                ? 'bg-green-500'
                : battery.remaining > 20
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, battery.remaining))}%` }}
          />
        </div>
      </div>

      {/* Position */}
      <div className="mt-4 text-xs text-slate-400">
        <div className="flex justify-between">
          <span>Lat:</span>
          <span className="font-mono">{position.lat.toFixed(7)}</span>
        </div>
        <div className="flex justify-between">
          <span>Lon:</span>
          <span className="font-mono">{position.lon.toFixed(7)}</span>
        </div>
      </div>
    </div>
  );
};

interface TelemetryItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}

const TelemetryItem: React.FC<TelemetryItemProps> = ({ icon, label, value, unit }) => (
  <div className="bg-slate-800/50 rounded-lg p-2">
    <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
      {icon}
      <span>{label}</span>
    </div>
    <div className="flex items-baseline">
      <span className="text-lg font-mono font-bold">{value}</span>
      <span className="text-xs text-slate-500 ml-1">{unit}</span>
    </div>
  </div>
);

export default TelemetryPanel;
