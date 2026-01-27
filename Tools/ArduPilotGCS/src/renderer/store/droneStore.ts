import { create } from 'zustand';

interface Position {
  lat: number;
  lon: number;
  alt: number;
  heading: number;
}

interface Attitude {
  roll: number;
  pitch: number;
  yaw: number;
}

interface Battery {
  voltage: number;
  current: number;
  remaining: number;
}

interface VfrHud {
  airspeed: number;
  groundspeed: number;
  heading: number;
  throttle: number;
  alt: number;
  climb: number;
}

interface Heartbeat {
  type: number;
  autopilot: number;
  base_mode: number;
  custom_mode: number;
  system_status: number;
}

interface Message {
  severity: string;
  text: string;
  timestamp: Date;
}

interface DroneState {
  connected: boolean;
  armed: boolean;
  mode: string;
  position: Position;
  attitude: Attitude;
  battery: Battery;
  vfrHud: VfrHud;
  heartbeat: Heartbeat | null;
  messages: Message[];
  gpsFixType: number;
  satelliteCount: number;

  // Actions
  setConnected: (connected: boolean) => void;
  setArmed: (armed: boolean) => void;
  setMode: (mode: string) => void;
  updatePosition: (position: Partial<Position>) => void;
  updateTelemetry: (attitude: Partial<Attitude>) => void;
  updateBattery: (battery: Partial<Battery>) => void;
  updateVfrHud: (data: Partial<VfrHud>) => void;
  updateHeartbeat: (data: Heartbeat) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  updateGps: (fixType: number, satellites: number) => void;
}

// Flight mode names for Copter
const COPTER_MODES: Record<number, string> = {
  0: 'STABILIZE',
  1: 'ACRO',
  2: 'ALT_HOLD',
  3: 'AUTO',
  4: 'GUIDED',
  5: 'LOITER',
  6: 'RTL',
  7: 'CIRCLE',
  9: 'LAND',
  11: 'DRIFT',
  13: 'SPORT',
  14: 'FLIP',
  15: 'AUTOTUNE',
  16: 'POSHOLD',
  17: 'BRAKE',
  18: 'THROW',
  19: 'AVOID_ADSB',
  20: 'GUIDED_NOGPS',
  21: 'SMART_RTL',
  22: 'FLOWHOLD',
  23: 'FOLLOW',
  24: 'ZIGZAG',
  25: 'SYSTEMID',
  26: 'AUTOROTATE',
  27: 'AUTO_RTL',
};

export const useDroneStore = create<DroneState>((set) => ({
  connected: false,
  armed: false,
  mode: 'UNKNOWN',
  position: {
    lat: 0,
    lon: 0,
    alt: 0,
    heading: 0,
  },
  attitude: {
    roll: 0,
    pitch: 0,
    yaw: 0,
  },
  battery: {
    voltage: 0,
    current: 0,
    remaining: 0,
  },
  vfrHud: {
    airspeed: 0,
    groundspeed: 0,
    heading: 0,
    throttle: 0,
    alt: 0,
    climb: 0,
  },
  heartbeat: null,
  messages: [],
  gpsFixType: 0,
  satelliteCount: 0,

  setConnected: (connected) => set({ connected }),
  setArmed: (armed) => set({ armed }),
  setMode: (mode) => set({ mode }),

  updatePosition: (position) =>
    set((state) => ({
      position: { ...state.position, ...position },
    })),

  updateTelemetry: (attitude) =>
    set((state) => ({
      attitude: { ...state.attitude, ...attitude },
    })),

  updateBattery: (battery) =>
    set((state) => ({
      battery: { ...state.battery, ...battery },
    })),

  updateVfrHud: (data) =>
    set((state) => ({
      vfrHud: { ...state.vfrHud, ...data },
    })),

  updateHeartbeat: (data) =>
    set((state) => {
      const armed = (data.base_mode & 128) !== 0;
      const mode = COPTER_MODES[data.custom_mode] || `MODE_${data.custom_mode}`;
      return {
        heartbeat: data,
        armed,
        mode,
      };
    }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-99), message],
    })),

  clearMessages: () => set({ messages: [] }),

  updateGps: (fixType, satellites) =>
    set({
      gpsFixType: fixType,
      satelliteCount: satellites,
    }),
}));
