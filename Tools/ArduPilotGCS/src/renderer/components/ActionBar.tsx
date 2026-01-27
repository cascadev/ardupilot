import React, { useState } from 'react';
import { useDroneStore } from '../store/droneStore';
import {
  Power,
  PowerOff,
  Plane,
  Home,
  PauseCircle,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

const ActionBar: React.FC = () => {
  const { connected, armed, mode } = useDroneStore();
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const sendCommand = async (command: string, params: Record<string, unknown> = {}) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.mavlink.sendCommand(command, params);
      if (!result.success) {
        console.error(`Command ${command} failed:`, result.error);
      }
    }
    setConfirmAction(null);
  };

  const handleArmDisarm = () => {
    if (armed) {
      setConfirmAction('disarm');
    } else {
      setConfirmAction('arm');
    }
  };

  const confirmAndExecute = (action: string) => {
    switch (action) {
      case 'arm':
        sendCommand('arm');
        break;
      case 'disarm':
        sendCommand('disarm');
        break;
      case 'takeoff':
        sendCommand('takeoff', { altitude: 10 });
        break;
      case 'land':
        sendCommand('land');
        break;
      case 'rtl':
        sendCommand('rtl');
        break;
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <>
      <div className="glass-panel p-2 flex items-center gap-2">
        {/* Arm/Disarm */}
        <button
          onClick={handleArmDisarm}
          className={`btn ${armed ? 'btn-danger' : 'btn-success'}`}
          title={armed ? 'Disarm' : 'Arm'}
        >
          {armed ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
          <span>{armed ? 'Disarm' : 'Arm'}</span>
        </button>

        {armed && (
          <>
            {/* Takeoff */}
            <button
              onClick={() => setConfirmAction('takeoff')}
              className="btn btn-primary"
              title="Takeoff"
            >
              <Plane className="w-5 h-5 rotate-45" />
              <span>Takeoff</span>
            </button>

            {/* Land */}
            <button
              onClick={() => setConfirmAction('land')}
              className="btn btn-warning"
              title="Land"
            >
              <Plane className="w-5 h-5 -rotate-45" />
              <span>Land</span>
            </button>

            {/* RTL */}
            <button
              onClick={() => setConfirmAction('rtl')}
              className="btn btn-secondary"
              title="Return to Launch"
            >
              <Home className="w-5 h-5" />
              <span>RTL</span>
            </button>
          </>
        )}

        {/* Mode Indicator */}
        <div className="px-3 py-2 bg-slate-700/50 rounded-lg">
          <span className="text-sm text-slate-400">Mode:</span>
          <span className="ml-2 font-medium">{mode}</span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-panel p-6 max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <div>
                <h3 className="text-lg font-semibold">Confirm Action</h3>
                <p className="text-slate-400">
                  Are you sure you want to {confirmAction}?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmAndExecute(confirmAction)}
                className={`btn ${
                  confirmAction === 'disarm' || confirmAction === 'arm'
                    ? armed
                      ? 'btn-danger'
                      : 'btn-success'
                    : 'btn-primary'
                }`}
              >
                {confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionBar;
