import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface Settings {
  connection: {
    lastType: string;
    lastPort: string;
    lastBaudRate: number;
    lastUdpPort: number;
    lastTcpHost: string;
    lastTcpPort: number;
  };
  map: {
    defaultLat: number;
    defaultLon: number;
    defaultZoom: number;
    mapProvider: string;
  };
  mission: {
    defaultAltitude: number;
    defaultSpeed: number;
    autoSave: boolean;
    lastMissionPath: string;
  };
  ui: {
    theme: string;
    sidebarCollapsed: boolean;
    showTelemetryPanel: boolean;
    showMessageLog: boolean;
  };
  units: {
    altitude: string;
    speed: string;
    distance: string;
  };
}

const DEFAULT_SETTINGS: Settings = {
  connection: {
    lastType: 'udp',
    lastPort: 'COM3',
    lastBaudRate: 115200,
    lastUdpPort: 14550,
    lastTcpHost: '127.0.0.1',
    lastTcpPort: 5760,
  },
  map: {
    defaultLat: 37.7749,
    defaultLon: -122.4194,
    defaultZoom: 15,
    mapProvider: 'osm',
  },
  mission: {
    defaultAltitude: 50,
    defaultSpeed: 5,
    autoSave: true,
    lastMissionPath: '',
  },
  ui: {
    theme: 'dark',
    sidebarCollapsed: false,
    showTelemetryPanel: true,
    showMessageLog: true,
  },
  units: {
    altitude: 'meters',
    speed: 'm/s',
    distance: 'meters',
  },
};

export class SettingsManager {
  private settings: Settings;
  private settingsPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.settings = this.loadSettings();
  }

  private loadSettings(): Settings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        const loaded = JSON.parse(data);
        // Merge with defaults to ensure all keys exist
        return this.deepMerge(DEFAULT_SETTINGS, loaded);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          (result as any)[key] = this.deepMerge(targetValue as object, sourceValue as object);
        } else if (sourceValue !== undefined) {
          (result as any)[key] = sourceValue;
        }
      }
    }

    return result;
  }

  get(key: string): unknown {
    const keys = key.split('.');
    let value: unknown = this.settings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  set(key: string, value: unknown): void {
    const keys = key.split('.');
    let obj: Record<string, unknown> = this.settings;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in obj) || typeof obj[k] !== 'object') {
        obj[k] = {};
      }
      obj = obj[k] as Record<string, unknown>;
    }

    obj[keys[keys.length - 1]] = value;
    this.saveSettings();
  }

  getAll(): Settings {
    return { ...this.settings };
  }

  reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }
}
