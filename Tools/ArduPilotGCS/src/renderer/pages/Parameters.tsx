import React, { useState } from 'react';
import { useDroneStore } from '../store/droneStore';
import {
  Search,
  Download,
  Upload,
  Save,
  RefreshCw,
  Sliders,
  AlertCircle,
} from 'lucide-react';

// Sample parameter definitions (in a real app, these would come from the vehicle)
const PARAMETER_GROUPS = {
  'Basic Tuning': [
    { name: 'ATC_RAT_RLL_P', value: 0.135, default: 0.135, description: 'Roll rate controller P gain' },
    { name: 'ATC_RAT_RLL_I', value: 0.135, default: 0.135, description: 'Roll rate controller I gain' },
    { name: 'ATC_RAT_RLL_D', value: 0.0036, default: 0.0036, description: 'Roll rate controller D gain' },
    { name: 'ATC_RAT_PIT_P', value: 0.135, default: 0.135, description: 'Pitch rate controller P gain' },
    { name: 'ATC_RAT_PIT_I', value: 0.135, default: 0.135, description: 'Pitch rate controller I gain' },
    { name: 'ATC_RAT_PIT_D', value: 0.0036, default: 0.0036, description: 'Pitch rate controller D gain' },
    { name: 'ATC_RAT_YAW_P', value: 0.18, default: 0.18, description: 'Yaw rate controller P gain' },
  ],
  'Flight Modes': [
    { name: 'FLTMODE1', value: 0, default: 0, description: 'Flight mode switch position 1' },
    { name: 'FLTMODE2', value: 2, default: 2, description: 'Flight mode switch position 2' },
    { name: 'FLTMODE3', value: 5, default: 5, description: 'Flight mode switch position 3' },
    { name: 'FLTMODE4', value: 3, default: 3, description: 'Flight mode switch position 4' },
    { name: 'FLTMODE5', value: 6, default: 6, description: 'Flight mode switch position 5' },
    { name: 'FLTMODE6', value: 9, default: 9, description: 'Flight mode switch position 6' },
  ],
  'Failsafe': [
    { name: 'FS_THR_ENABLE', value: 1, default: 1, description: 'Throttle failsafe enable' },
    { name: 'FS_THR_VALUE', value: 975, default: 975, description: 'Throttle failsafe threshold' },
    { name: 'FS_GCS_ENABLE', value: 1, default: 1, description: 'GCS failsafe enable' },
    { name: 'FS_BATT_ENABLE', value: 0, default: 0, description: 'Battery failsafe enable' },
    { name: 'FS_BATT_VOLTAGE', value: 10.5, default: 10.5, description: 'Battery failsafe voltage' },
  ],
  'Arming': [
    { name: 'ARMING_CHECK', value: 1, default: 1, description: 'Arming check bitmask' },
    { name: 'ARMING_REQUIRE', value: 1, default: 1, description: 'Arming require switch/RC' },
    { name: 'ARMING_RUDDER', value: 2, default: 2, description: 'Rudder arming enable' },
  ],
  'Battery': [
    { name: 'BATT_MONITOR', value: 4, default: 4, description: 'Battery monitoring type' },
    { name: 'BATT_CAPACITY', value: 3300, default: 3300, description: 'Battery capacity (mAh)' },
    { name: 'BATT_LOW_VOLT', value: 10.5, default: 10.5, description: 'Low battery voltage' },
    { name: 'BATT_CRT_VOLT', value: 10.1, default: 10.1, description: 'Critical battery voltage' },
  ],
  'GPS': [
    { name: 'GPS_TYPE', value: 1, default: 1, description: 'GPS type' },
    { name: 'GPS_NAVFILTER', value: 8, default: 8, description: 'Navigation filter setting' },
    { name: 'GPS_AUTO_CONFIG', value: 1, default: 1, description: 'Automatic GPS config' },
  ],
};

const Parameters: React.FC = () => {
  const { connected } = useDroneStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [modifiedParams, setModifiedParams] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const allParams = Object.entries(PARAMETER_GROUPS).flatMap(([group, params]) =>
    params.map((p) => ({ ...p, group }))
  );

  const filteredParams = searchTerm
    ? allParams.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : selectedGroup
    ? PARAMETER_GROUPS[selectedGroup as keyof typeof PARAMETER_GROUPS] || []
    : [];

  const handleParamChange = (name: string, value: number) => {
    setModifiedParams((prev) => ({ ...prev, [name]: value }));
  };

  const isModified = (name: string) => name in modifiedParams;

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate loading parameters from vehicle
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleWriteChanges = async () => {
    setLoading(true);
    // Simulate writing parameters to vehicle
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setModifiedParams({});
    setLoading(false);
  };

  if (!connected) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Sliders className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-slate-400">Not Connected</h2>
          <p className="text-slate-500 mt-2">Connect to a vehicle to manage parameters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar - Parameter Groups */}
      <div className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-semibold">Parameter Groups</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {Object.keys(PARAMETER_GROUPS).map((group) => (
            <button
              key={group}
              onClick={() => {
                setSelectedGroup(group);
                setSearchTerm('');
              }}
              className={`w-full text-left px-4 py-2 transition-colors ${
                selectedGroup === group
                  ? 'bg-sky-600/20 text-sky-400 border-l-2 border-sky-500'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-700 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value) setSelectedGroup(null);
              }}
              placeholder="Search parameters..."
              className="input w-full pl-10"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="btn btn-ghost"
              title="Refresh from vehicle"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="btn btn-ghost" title="Load from file">
              <Upload className="w-4 h-4" />
            </button>
            <button className="btn btn-ghost" title="Save to file">
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleWriteChanges}
              disabled={Object.keys(modifiedParams).length === 0 || loading}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4" />
              Write Changes ({Object.keys(modifiedParams).length})
            </button>
          </div>
        </div>

        {/* Parameters Table */}
        <div className="flex-1 overflow-y-auto">
          {!selectedGroup && !searchTerm ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <p>Select a parameter group or search for parameters</p>
            </div>
          ) : filteredParams.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <p>No parameters found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                    Parameter
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400 w-40">
                    Value
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400 w-24">
                    Default
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredParams.map((param) => {
                  const currentValue = modifiedParams[param.name] ?? param.value;
                  const modified = isModified(param.name);
                  const differentFromDefault = currentValue !== param.default;

                  return (
                    <tr
                      key={param.name}
                      className={`border-b border-slate-700/50 ${
                        modified ? 'bg-amber-600/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {modified && (
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                          )}
                          <span className="font-mono text-sm">{param.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={currentValue}
                          onChange={(e) =>
                            handleParamChange(param.name, parseFloat(e.target.value))
                          }
                          className={`input w-full text-sm font-mono ${
                            differentFromDefault ? 'border-amber-500' : ''
                          }`}
                          step="any"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                        {param.default}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {param.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Status Bar */}
        {Object.keys(modifiedParams).length > 0 && (
          <div className="p-4 border-t border-slate-700 bg-amber-600/10 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-amber-400">
              {Object.keys(modifiedParams).length} parameter(s) modified. Click "Write Changes" to
              save to vehicle.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Parameters;
