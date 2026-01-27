import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },

  // MAVLink connection
  mavlink: {
    connect: (connectionType: string, params: Record<string, unknown>) =>
      ipcRenderer.invoke('mavlink:connect', connectionType, params),
    disconnect: () => ipcRenderer.invoke('mavlink:disconnect'),
    isConnected: () => ipcRenderer.invoke('mavlink:isConnected'),
    sendCommand: (command: string, params: Record<string, unknown>) =>
      ipcRenderer.invoke('mavlink:sendCommand', command, params),
    getSerialPorts: () => ipcRenderer.invoke('mavlink:getSerialPorts'),

    // Event listeners for telemetry data
    onTelemetry: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data);
      ipcRenderer.on('mavlink:telemetry', handler);
      return () => ipcRenderer.removeListener('mavlink:telemetry', handler);
    },
    onHeartbeat: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data);
      ipcRenderer.on('mavlink:heartbeat', handler);
      return () => ipcRenderer.removeListener('mavlink:heartbeat', handler);
    },
    onAttitude: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data);
      ipcRenderer.on('mavlink:attitude', handler);
      return () => ipcRenderer.removeListener('mavlink:attitude', handler);
    },
    onGpsRaw: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data);
      ipcRenderer.on('mavlink:gps_raw', handler);
      return () => ipcRenderer.removeListener('mavlink:gps_raw', handler);
    },
    onGlobalPosition: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data);
      ipcRenderer.on('mavlink:global_position', handler);
      return () => ipcRenderer.removeListener('mavlink:global_position', handler);
    },
    onBatteryStatus: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data);
      ipcRenderer.on('mavlink:battery_status', handler);
      return () => ipcRenderer.removeListener('mavlink:battery_status', handler);
    },
    onVfrHud: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data);
      ipcRenderer.on('mavlink:vfr_hud', handler);
      return () => ipcRenderer.removeListener('mavlink:vfr_hud', handler);
    },
    onSysStatus: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data);
      ipcRenderer.on('mavlink:sys_status', handler);
      return () => ipcRenderer.removeListener('mavlink:sys_status', handler);
    },
    onStatusText: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data);
      ipcRenderer.on('mavlink:statustext', handler);
      return () => ipcRenderer.removeListener('mavlink:statustext', handler);
    },
    onConnectionStatus: (callback: (data: { connected: boolean }) => void) => {
      const handler = (_: unknown, data: { connected: boolean }) => callback(data);
      ipcRenderer.on('mavlink:connection_status', handler);
      return () => ipcRenderer.removeListener('mavlink:connection_status', handler);
    },
    onMissionProgress: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data);
      ipcRenderer.on('mavlink:mission_progress', handler);
      return () => ipcRenderer.removeListener('mavlink:mission_progress', handler);
    },
  },

  // Mission management
  mission: {
    upload: (waypoints: unknown[]) => ipcRenderer.invoke('mission:upload', waypoints),
    download: () => ipcRenderer.invoke('mission:download'),
    clear: () => ipcRenderer.invoke('mission:clear'),
    loadFromFile: (filePath: string) => ipcRenderer.invoke('mission:loadFromFile', filePath),
    saveToFile: (filePath: string, waypoints: unknown[]) =>
      ipcRenderer.invoke('mission:saveToFile', filePath, waypoints),
  },

  // Dialogs
  dialog: {
    showMessage: (options: Electron.MessageBoxOptions) =>
      ipcRenderer.invoke('dialog:showMessage', options),
  },

  // Menu event handlers
  onMenuEvent: (channel: string, callback: (data?: unknown) => void) => {
    const handler = (_: unknown, data?: unknown) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
});
