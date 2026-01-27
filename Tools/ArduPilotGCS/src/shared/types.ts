// Shared type definitions for ArduPilot GCS

export interface Waypoint {
  id: string;
  seq: number;
  frame: number;
  command: number;
  param1: number;
  param2: number;
  param3: number;
  param4: number;
  lat: number;
  lon: number;
  alt: number;
  autocontinue: number;
}

export interface Position {
  lat: number;
  lon: number;
  alt: number;
  heading: number;
}

export interface Attitude {
  roll: number;
  pitch: number;
  yaw: number;
}

export interface Battery {
  voltage: number;
  current: number;
  remaining: number;
}

export interface VfrHud {
  airspeed: number;
  groundspeed: number;
  heading: number;
  throttle: number;
  alt: number;
  climb: number;
}

export interface Heartbeat {
  type: number;
  autopilot: number;
  base_mode: number;
  custom_mode: number;
  system_status: number;
  mavlink_version: number;
}

export interface StatusMessage {
  severity: string;
  severityLabel: string;
  text: string;
  timestamp: Date;
}

export interface ConnectionParams {
  type: 'serial' | 'udp' | 'tcp';
  comPort?: string;
  baudRate?: number;
  host?: string;
  port?: number;
}

export interface MissionResult {
  success: boolean;
  error?: string;
  mission?: Waypoint[];
}

export interface CommandResult {
  success: boolean;
  error?: string;
  result?: unknown;
}

// MAVLink command definitions
export const MAV_CMD = {
  NAV_WAYPOINT: 16,
  NAV_LOITER_UNLIM: 17,
  NAV_LOITER_TURNS: 18,
  NAV_LOITER_TIME: 19,
  NAV_RETURN_TO_LAUNCH: 20,
  NAV_LAND: 21,
  NAV_TAKEOFF: 22,
  NAV_LOITER_TO_ALT: 31,
  NAV_SPLINE_WAYPOINT: 82,
  NAV_DELAY: 93,
  DO_CHANGE_SPEED: 178,
  DO_SET_HOME: 179,
  DO_JUMP: 177,
  DO_SET_SERVO: 183,
  DO_SET_RELAY: 181,
  DO_DIGICAM_CONTROL: 203,
  COMPONENT_ARM_DISARM: 400,
  DO_SET_MODE: 176,
  MISSION_START: 300,
} as const;

export const MAV_FRAME = {
  GLOBAL: 0,
  LOCAL_NED: 1,
  MISSION: 2,
  GLOBAL_RELATIVE_ALT: 3,
  LOCAL_ENU: 4,
  GLOBAL_INT: 5,
  GLOBAL_RELATIVE_ALT_INT: 6,
  LOCAL_OFFSET_NED: 7,
  BODY_NED: 8,
  BODY_OFFSET_NED: 9,
  GLOBAL_TERRAIN_ALT: 10,
  GLOBAL_TERRAIN_ALT_INT: 11,
} as const;

// Flight modes for Copter
export const COPTER_MODES: Record<number, string> = {
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

// GPS fix types
export const GPS_FIX_TYPE: Record<number, string> = {
  0: 'No GPS',
  1: 'No Fix',
  2: '2D Fix',
  3: '3D Fix',
  4: 'DGPS',
  5: 'RTK Float',
  6: 'RTK Fixed',
  7: 'Static',
  8: 'PPP',
};
