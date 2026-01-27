import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import * as path from 'path';
import { MAVLinkManager } from './mavlink/MAVLinkManager';
import { SettingsManager } from './settings/SettingsManager';
import { MissionManager } from './mission/MissionManager';

let mainWindow: BrowserWindow | null = null;
let mavlinkManager: MAVLinkManager | null = null;
let settingsManager: SettingsManager | null = null;
let missionManager: MissionManager | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'ArduPilot GCS',
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1a1a2e',
    show: false,
  });

  // Create menu
  const menu = createMenu();
  Menu.setApplicationMenu(menu);

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu(): Menu {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Mission',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-mission'),
        },
        {
          label: 'Open Mission...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openFile'],
              filters: [
                { name: 'Mission Files', extensions: ['waypoints', 'txt', 'mission'] },
              ],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('menu:open-mission', result.filePaths[0]);
            }
          },
        },
        {
          label: 'Save Mission',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save-mission'),
        },
        {
          label: 'Save Mission As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow!, {
              filters: [
                { name: 'Waypoints File', extensions: ['waypoints'] },
                { name: 'Text File', extensions: ['txt'] },
              ],
            });
            if (!result.canceled && result.filePath) {
              mainWindow?.webContents.send('menu:save-mission-as', result.filePath);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Connection',
      submenu: [
        {
          label: 'Connect to Vehicle...',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow?.webContents.send('menu:connect'),
        },
        {
          label: 'Disconnect',
          click: () => mainWindow?.webContents.send('menu:disconnect'),
        },
        { type: 'separator' },
        {
          label: 'Connection Settings...',
          click: () => mainWindow?.webContents.send('menu:connection-settings'),
        },
      ],
    },
    {
      label: 'Mission',
      submenu: [
        {
          label: 'Upload to Vehicle',
          accelerator: 'CmdOrCtrl+U',
          click: () => mainWindow?.webContents.send('menu:upload-mission'),
        },
        {
          label: 'Download from Vehicle',
          accelerator: 'CmdOrCtrl+D',
          click: () => mainWindow?.webContents.send('menu:download-mission'),
        },
        { type: 'separator' },
        {
          label: 'Clear Mission',
          click: () => mainWindow?.webContents.send('menu:clear-mission'),
        },
        { type: 'separator' },
        {
          label: 'Survey (Grid)',
          click: () => mainWindow?.webContents.send('menu:add-survey'),
        },
        {
          label: 'Corridor Scan',
          click: () => mainWindow?.webContents.send('menu:add-corridor'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Map View',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.webContents.send('menu:view-map'),
        },
        {
          label: 'Flight Data',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.webContents.send('menu:view-flight-data'),
        },
        {
          label: 'Parameters',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow?.webContents.send('menu:view-parameters'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            mainWindow?.setFullScreen(!mainWindow?.isFullScreen());
          },
        },
        { type: 'separator' },
        {
          label: 'Developer Tools',
          accelerator: 'F12',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'ArduPilot Documentation',
          click: () => {
            require('electron').shell.openExternal('https://ardupilot.org/');
          },
        },
        {
          label: 'MAVLink Protocol',
          click: () => {
            require('electron').shell.openExternal('https://mavlink.io/en/');
          },
        },
        { type: 'separator' },
        {
          label: 'About ArduPilot GCS',
          click: () => mainWindow?.webContents.send('menu:about'),
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

function setupIpcHandlers(): void {
  // Settings handlers
  ipcMain.handle('settings:get', (_, key: string) => {
    return settingsManager?.get(key);
  });

  ipcMain.handle('settings:set', (_, key: string, value: unknown) => {
    settingsManager?.set(key, value);
  });

  ipcMain.handle('settings:getAll', () => {
    return settingsManager?.getAll();
  });

  // MAVLink connection handlers
  ipcMain.handle('mavlink:connect', async (_, connectionType: string, params: Record<string, unknown>) => {
    try {
      await mavlinkManager?.connect(connectionType, params);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('mavlink:disconnect', async () => {
    try {
      await mavlinkManager?.disconnect();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('mavlink:isConnected', () => {
    return mavlinkManager?.isConnected() ?? false;
  });

  ipcMain.handle('mavlink:sendCommand', async (_, command: string, params: Record<string, unknown>) => {
    try {
      const result = await mavlinkManager?.sendCommand(command, params);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('mavlink:getSerialPorts', async () => {
    return mavlinkManager?.getAvailablePorts() ?? [];
  });

  // Mission handlers
  ipcMain.handle('mission:upload', async (_, waypoints: unknown[]) => {
    try {
      await missionManager?.uploadMission(waypoints);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('mission:download', async () => {
    try {
      const mission = await missionManager?.downloadMission();
      return { success: true, mission };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('mission:clear', async () => {
    try {
      await missionManager?.clearMission();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('mission:loadFromFile', async (_, filePath: string) => {
    try {
      const mission = await missionManager?.loadFromFile(filePath);
      return { success: true, mission };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('mission:saveToFile', async (_, filePath: string, waypoints: unknown[]) => {
    try {
      await missionManager?.saveToFile(filePath, waypoints);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Dialog handlers
  ipcMain.handle('dialog:showMessage', async (_, options: Electron.MessageBoxOptions) => {
    return dialog.showMessageBox(mainWindow!, options);
  });
}

app.whenReady().then(() => {
  // Initialize managers
  settingsManager = new SettingsManager();
  mavlinkManager = new MAVLinkManager((event, data) => {
    mainWindow?.webContents.send(event, data);
  });
  missionManager = new MissionManager(mavlinkManager);

  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    mavlinkManager?.disconnect();
    app.quit();
  }
});

app.on('before-quit', () => {
  mavlinkManager?.disconnect();
});
