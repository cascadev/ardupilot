import React, { useRef, useEffect } from 'react';
import { useDroneStore } from '../store/droneStore';
import {
  Gauge,
  Battery,
  Compass,
  ArrowUp,
  Wind,
  Thermometer,
  Satellite,
  Activity,
  Terminal,
} from 'lucide-react';

const FlightData: React.FC = () => {
  const {
    connected,
    armed,
    mode,
    position,
    attitude,
    battery,
    vfrHud,
    messages,
    gpsFixType,
    satelliteCount,
  } = useDroneStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'emergency':
      case 'alert':
      case 'critical':
        return 'text-red-500';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      case 'notice':
        return 'text-blue-400';
      case 'info':
        return 'text-slate-300';
      default:
        return 'text-slate-500';
    }
  };

  if (!connected) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-slate-400">Not Connected</h2>
          <p className="text-slate-500 mt-2">Connect to a vehicle to see flight data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Status Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Flight Data</h1>
            <p className="text-slate-400">Real-time vehicle telemetry</p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`px-4 py-2 rounded-lg ${
                armed ? 'bg-green-600/20 text-green-400' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {armed ? 'ARMED' : 'DISARMED'}
            </div>
            <div className="px-4 py-2 bg-sky-600/20 text-sky-400 rounded-lg">{mode}</div>
          </div>
        </div>

        {/* Main Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Attitude Indicator */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-400" />
                Attitude
              </h3>
            </div>
            <div className="card-body">
              <div className="relative w-full aspect-square max-w-[250px] mx-auto">
                {/* Artificial Horizon */}
                <div className="absolute inset-4 rounded-full overflow-hidden border-4 border-slate-600">
                  <div
                    className="absolute inset-0 transition-transform duration-100"
                    style={{
                      background: `linear-gradient(to bottom, #3b82f6 0%, #3b82f6 ${
                        50 - attitude.pitch * 1.5
                      }%, #854d0e ${50 - attitude.pitch * 1.5}%, #854d0e 100%)`,
                      transform: `rotate(${-attitude.roll}deg)`,
                      transformOrigin: 'center',
                    }}
                  />
                  {/* Center reference */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-0.5 bg-yellow-400" />
                    <div className="absolute w-3 h-3 border-2 border-yellow-400 rounded-full" />
                  </div>
                </div>
                {/* Compass ring */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: `rotate(${-position.heading}deg)` }}
                >
                  <div className="absolute top-1 text-xs font-bold text-sky-400">N</div>
                  <div className="absolute right-1 text-xs text-slate-500">E</div>
                  <div className="absolute bottom-1 text-xs text-slate-500">S</div>
                  <div className="absolute left-1 text-xs text-slate-500">W</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                  <div className="text-2xl font-mono font-bold">
                    {attitude.roll.toFixed(1)}°
                  </div>
                  <div className="text-xs text-slate-400">Roll</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold">
                    {attitude.pitch.toFixed(1)}°
                  </div>
                  <div className="text-xs text-slate-400">Pitch</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold">
                    {position.heading.toFixed(0)}°
                  </div>
                  <div className="text-xs text-slate-400">Heading</div>
                </div>
              </div>
            </div>
          </div>

          {/* Speed & Altitude */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <Gauge className="w-5 h-5 text-sky-400" />
                Speed & Altitude
              </h3>
            </div>
            <div className="card-body space-y-6">
              <TelemetryGauge
                label="Ground Speed"
                value={vfrHud.groundspeed}
                unit="m/s"
                max={30}
                color="sky"
              />
              <TelemetryGauge
                label="Air Speed"
                value={vfrHud.airspeed}
                unit="m/s"
                max={30}
                color="cyan"
              />
              <TelemetryGauge
                label="Altitude"
                value={position.alt}
                unit="m"
                max={500}
                color="emerald"
              />
              <TelemetryGauge
                label="Climb Rate"
                value={vfrHud.climb}
                unit="m/s"
                max={10}
                min={-10}
                color="amber"
              />
            </div>
          </div>

          {/* Battery & GPS */}
          <div className="space-y-6">
            {/* Battery Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <Battery className="w-5 h-5 text-sky-400" />
                  Battery
                </h3>
              </div>
              <div className="card-body">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-32">
                    <div className="absolute inset-0 border-2 border-slate-600 rounded-lg overflow-hidden">
                      <div
                        className={`absolute bottom-0 left-0 right-0 transition-all ${
                          battery.remaining > 50
                            ? 'bg-green-500'
                            : battery.remaining > 20
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ height: `${Math.max(0, battery.remaining)}%` }}
                      />
                    </div>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-slate-600 rounded-t" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="text-3xl font-mono font-bold">
                        {battery.remaining}%
                      </div>
                      <div className="text-sm text-slate-400">Remaining</div>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <div className="text-lg font-mono">
                          {battery.voltage.toFixed(1)}V
                        </div>
                        <div className="text-xs text-slate-400">Voltage</div>
                      </div>
                      <div>
                        <div className="text-lg font-mono">
                          {battery.current.toFixed(1)}A
                        </div>
                        <div className="text-xs text-slate-400">Current</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <Satellite className="w-5 h-5 text-sky-400" />
                  GPS
                </h3>
              </div>
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div
                      className={`text-lg font-semibold ${
                        gpsFixType >= 3
                          ? 'text-green-400'
                          : gpsFixType >= 2
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {gpsFixType >= 3 ? '3D Fix' : gpsFixType >= 2 ? '2D Fix' : 'No Fix'}
                    </div>
                    <div className="text-sm text-slate-400">
                      {satelliteCount} satellites
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-4 rounded-sm ${
                          i < satelliteCount
                            ? satelliteCount >= 8
                              ? 'bg-green-500'
                              : satelliteCount >= 5
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latitude</span>
                    <span className="font-mono">{position.lat.toFixed(7)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Longitude</span>
                    <span className="font-mono">{position.lon.toFixed(7)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Altitude (AMSL)</span>
                    <span className="font-mono">{position.alt.toFixed(1)} m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Log */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Terminal className="w-5 h-5 text-sky-400" />
              Message Log
            </h3>
            <span className="text-sm text-slate-400">{messages.length} messages</span>
          </div>
          <div className="h-48 overflow-y-auto p-4 font-mono text-sm bg-slate-900">
            {messages.length === 0 ? (
              <div className="text-slate-500 text-center">No messages</div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-slate-500">{formatTime(msg.timestamp)}</span>
                  <span className={`font-semibold ${getSeverityColor(msg.severity)}`}>
                    [{msg.severity}]
                  </span>
                  <span className="text-slate-300">{msg.text}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface TelemetryGaugeProps {
  label: string;
  value: number;
  unit: string;
  max: number;
  min?: number;
  color: string;
}

const TelemetryGauge: React.FC<TelemetryGaugeProps> = ({
  label,
  value,
  unit,
  max,
  min = 0,
  color,
}) => {
  const range = max - min;
  const normalizedValue = ((value - min) / range) * 100;
  const clampedValue = Math.max(0, Math.min(100, normalizedValue));

  const colorClasses: Record<string, string> = {
    sky: 'bg-sky-500',
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-lg font-mono font-bold">
          {value.toFixed(1)}
          <span className="text-sm text-slate-500 ml-1">{unit}</span>
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${colorClasses[color]}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};

export default FlightData;
