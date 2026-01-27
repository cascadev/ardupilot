import React from 'react';
import { useMissionStore, COMMAND_NAMES, MAV_CMD, MAV_FRAME, Waypoint } from '../store/missionStore';
import {
  MapPin,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plane,
  RotateCcw,
  Clock,
  Circle,
} from 'lucide-react';

const WaypointPanel: React.FC = () => {
  const {
    waypoints,
    selectedWaypointId,
    currentWaypoint,
    selectWaypoint,
    removeWaypoint,
    updateWaypoint,
    reorderWaypoints,
  } = useMissionStore();

  const selectedWaypoint = waypoints.find((wp) => wp.id === selectedWaypointId);

  const getCommandIcon = (command: number) => {
    switch (command) {
      case MAV_CMD.NAV_TAKEOFF:
        return <Plane className="w-4 h-4 rotate-45" />;
      case MAV_CMD.NAV_RETURN_TO_LAUNCH:
        return <RotateCcw className="w-4 h-4" />;
      case MAV_CMD.NAV_LOITER_TIME:
      case MAV_CMD.NAV_LOITER_UNLIM:
        return <Clock className="w-4 h-4" />;
      case MAV_CMD.NAV_LOITER_TURNS:
        return <Circle className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < waypoints.length) {
      reorderWaypoints(index, newIndex);
    }
  };

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold">Mission Waypoints</h2>
        <p className="text-sm text-slate-400 mt-1">
          {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Waypoint List */}
      <div className="flex-1 overflow-y-auto">
        {waypoints.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No waypoints</p>
            <p className="text-sm mt-1">Click on the map to add waypoints</p>
          </div>
        ) : (
          <div className="py-2">
            {waypoints.map((wp, index) => (
              <div
                key={wp.id}
                className={`group flex items-center px-4 py-2 cursor-pointer transition-colors ${
                  wp.id === selectedWaypointId
                    ? 'bg-sky-600/20 border-l-2 border-sky-500'
                    : 'hover:bg-slate-700/50'
                } ${wp.seq === currentWaypoint ? 'border-l-2 border-green-500' : ''}`}
                onClick={() => selectWaypoint(wp.id)}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    wp.seq === currentWaypoint
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {wp.seq}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getCommandIcon(wp.command)}
                    <span className="text-sm font-medium truncate">
                      {COMMAND_NAMES[wp.command] || `CMD ${wp.command}`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Alt: {wp.alt}m
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveWaypoint(index, 'up');
                    }}
                    className="p-1 hover:bg-slate-600 rounded"
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveWaypoint(index, 'down');
                    }}
                    className="p-1 hover:bg-slate-600 rounded"
                    disabled={index === waypoints.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeWaypoint(wp.id);
                    }}
                    className="p-1 hover:bg-red-600/50 rounded text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waypoint Editor */}
      {selectedWaypoint && (
        <div className="border-t border-slate-700 p-4">
          <h3 className="text-sm font-semibold mb-3">Edit Waypoint {selectedWaypoint.seq}</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Command</label>
              <select
                value={selectedWaypoint.command}
                onChange={(e) =>
                  updateWaypoint(selectedWaypoint.id, {
                    command: Number(e.target.value),
                  })
                }
                className="select w-full text-sm"
              >
                <option value={MAV_CMD.NAV_WAYPOINT}>Waypoint</option>
                <option value={MAV_CMD.NAV_TAKEOFF}>Takeoff</option>
                <option value={MAV_CMD.NAV_LAND}>Land</option>
                <option value={MAV_CMD.NAV_RETURN_TO_LAUNCH}>Return to Launch</option>
                <option value={MAV_CMD.NAV_LOITER_UNLIM}>Loiter Unlimited</option>
                <option value={MAV_CMD.NAV_LOITER_TIME}>Loiter Time</option>
                <option value={MAV_CMD.NAV_LOITER_TURNS}>Loiter Turns</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  value={selectedWaypoint.lat}
                  onChange={(e) =>
                    updateWaypoint(selectedWaypoint.id, {
                      lat: Number(e.target.value),
                    })
                  }
                  className="input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  value={selectedWaypoint.lon}
                  onChange={(e) =>
                    updateWaypoint(selectedWaypoint.id, {
                      lon: Number(e.target.value),
                    })
                  }
                  className="input w-full text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Altitude (m)</label>
              <input
                type="number"
                value={selectedWaypoint.alt}
                onChange={(e) =>
                  updateWaypoint(selectedWaypoint.id, {
                    alt: Number(e.target.value),
                  })
                }
                className="input w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Frame</label>
              <select
                value={selectedWaypoint.frame}
                onChange={(e) =>
                  updateWaypoint(selectedWaypoint.id, {
                    frame: Number(e.target.value),
                  })
                }
                className="select w-full text-sm"
              >
                <option value={MAV_FRAME.GLOBAL}>Global (AMSL)</option>
                <option value={MAV_FRAME.GLOBAL_RELATIVE_ALT}>Relative to Home</option>
                <option value={MAV_FRAME.GLOBAL_TERRAIN_ALT}>Terrain Following</option>
              </select>
            </div>

            {/* Command-specific parameters */}
            {selectedWaypoint.command === MAV_CMD.NAV_LOITER_TIME && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Loiter Time (s)</label>
                <input
                  type="number"
                  value={selectedWaypoint.param1}
                  onChange={(e) =>
                    updateWaypoint(selectedWaypoint.id, {
                      param1: Number(e.target.value),
                    })
                  }
                  className="input w-full text-sm"
                />
              </div>
            )}

            {selectedWaypoint.command === MAV_CMD.NAV_LOITER_TURNS && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Number of Turns</label>
                <input
                  type="number"
                  value={selectedWaypoint.param1}
                  onChange={(e) =>
                    updateWaypoint(selectedWaypoint.id, {
                      param1: Number(e.target.value),
                    })
                  }
                  className="input w-full text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Yaw (degrees)</label>
              <input
                type="number"
                value={selectedWaypoint.param4}
                onChange={(e) =>
                  updateWaypoint(selectedWaypoint.id, {
                    param4: Number(e.target.value),
                  })
                }
                className="input w-full text-sm"
                placeholder="0 = no change"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaypointPanel;
