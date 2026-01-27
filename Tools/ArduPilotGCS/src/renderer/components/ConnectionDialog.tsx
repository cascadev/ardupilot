import React, { useState, useEffect } from 'react';
import { useDroneStore } from '../store/droneStore';
import { X, Usb, Wifi, Globe, RefreshCw } from 'lucide-react';

interface ConnectionDialogProps {
  onClose: () => void;
}

const ConnectionDialog: React.FC<ConnectionDialogProps> = ({ onClose }) => {
  const { connected } = useDroneStore();
  const [connectionType, setConnectionType] = useState<'serial' | 'udp' | 'tcp'>('udp');
  const [serialPort, setSerialPort] = useState('COM3');
  const [baudRate, setBaudRate] = useState(115200);
  const [udpPort, setUdpPort] = useState(14550);
  const [tcpHost, setTcpHost] = useState('127.0.0.1');
  const [tcpPort, setTcpPort] = useState(5760);
  const [availablePorts, setAvailablePorts] = useState<Array<{ path: string; manufacturer?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSerialPorts();
  }, []);

  const loadSerialPorts = async () => {
    if (window.electronAPI) {
      const ports = await window.electronAPI.mavlink.getSerialPorts();
      setAvailablePorts(ports);
      if (ports.length > 0 && !serialPort) {
        setSerialPort(ports[0].path);
      }
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      let params: Record<string, unknown> = {};

      switch (connectionType) {
        case 'serial':
          params = { comPort: serialPort, baudRate };
          break;
        case 'udp':
          params = { port: udpPort };
          break;
        case 'tcp':
          params = { host: tcpHost, port: tcpPort };
          break;
      }

      const result = await window.electronAPI.mavlink.connect(connectionType, params);

      if (!result.success) {
        setError(result.error || 'Connection failed');
      } else {
        onClose();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await window.electronAPI.mavlink.disconnect();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold">Connection Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Connection Type Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setConnectionType('serial')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                connectionType === 'serial'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Usb className="w-4 h-4" />
              Serial
            </button>
            <button
              onClick={() => setConnectionType('udp')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                connectionType === 'udp'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Wifi className="w-4 h-4" />
              UDP
            </button>
            <button
              onClick={() => setConnectionType('tcp')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                connectionType === 'tcp'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Globe className="w-4 h-4" />
              TCP
            </button>
          </div>

          {/* Serial Options */}
          {connectionType === 'serial' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Serial Port</label>
                <div className="flex gap-2">
                  <select
                    value={serialPort}
                    onChange={(e) => setSerialPort(e.target.value)}
                    className="select flex-1"
                  >
                    {availablePorts.length === 0 ? (
                      <option value="">No ports found</option>
                    ) : (
                      availablePorts.map((port) => (
                        <option key={port.path} value={port.path}>
                          {port.path} {port.manufacturer && `(${port.manufacturer})`}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    onClick={loadSerialPorts}
                    className="btn btn-ghost"
                    title="Refresh ports"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Baud Rate</label>
                <select
                  value={baudRate}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  className="select w-full"
                >
                  <option value={9600}>9600</option>
                  <option value={19200}>19200</option>
                  <option value={38400}>38400</option>
                  <option value={57600}>57600</option>
                  <option value={115200}>115200</option>
                  <option value={230400}>230400</option>
                  <option value={460800}>460800</option>
                  <option value={921600}>921600</option>
                </select>
              </div>
            </div>
          )}

          {/* UDP Options */}
          {connectionType === 'udp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Listen Port</label>
                <input
                  type="number"
                  value={udpPort}
                  onChange={(e) => setUdpPort(Number(e.target.value))}
                  className="input w-full"
                  placeholder="14550"
                />
              </div>
              <p className="text-sm text-slate-500">
                The GCS will listen for MAVLink packets on this UDP port.
                For SITL simulation, use port 14550.
              </p>
            </div>
          )}

          {/* TCP Options */}
          {connectionType === 'tcp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Host</label>
                <input
                  type="text"
                  value={tcpHost}
                  onChange={(e) => setTcpHost(e.target.value)}
                  className="input w-full"
                  placeholder="127.0.0.1"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Port</label>
                <input
                  type="number"
                  value={tcpPort}
                  onChange={(e) => setTcpPort(Number(e.target.value))}
                  className="input w-full"
                  placeholder="5760"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          {connected ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionDialog;
