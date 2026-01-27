import { create } from 'zustand';

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

export interface SurveyArea {
  id: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  altitude: number;
  spacing: number;
  angle: number;
}

interface MissionState {
  waypoints: Waypoint[];
  selectedWaypointId: string | null;
  currentWaypoint: number;
  homePosition: { lat: number; lon: number; alt: number } | null;
  surveyAreas: SurveyArea[];
  missionName: string;
  isDirty: boolean;
  filePath: string | null;

  // Actions
  addWaypoint: (waypoint: Omit<Waypoint, 'id' | 'seq'>) => void;
  removeWaypoint: (id: string) => void;
  updateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
  selectWaypoint: (id: string | null) => void;
  reorderWaypoints: (fromIndex: number, toIndex: number) => void;
  setCurrentWaypoint: (seq: number) => void;
  setHomePosition: (position: { lat: number; lon: number; alt: number }) => void;
  loadMission: (waypoints: Waypoint[]) => void;
  clearMission: () => void;
  addSurveyArea: (area: Omit<SurveyArea, 'id'>) => void;
  removeSurveyArea: (id: string) => void;
  setMissionName: (name: string) => void;
  setFilePath: (path: string | null) => void;
  markClean: () => void;
}

// Command definitions
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
} as const;

export const MAV_FRAME = {
  GLOBAL: 0,
  GLOBAL_RELATIVE_ALT: 3,
  GLOBAL_TERRAIN_ALT: 10,
} as const;

export const COMMAND_NAMES: Record<number, string> = {
  [MAV_CMD.NAV_WAYPOINT]: 'Waypoint',
  [MAV_CMD.NAV_LOITER_UNLIM]: 'Loiter Unlimited',
  [MAV_CMD.NAV_LOITER_TURNS]: 'Loiter Turns',
  [MAV_CMD.NAV_LOITER_TIME]: 'Loiter Time',
  [MAV_CMD.NAV_RETURN_TO_LAUNCH]: 'Return to Launch',
  [MAV_CMD.NAV_LAND]: 'Land',
  [MAV_CMD.NAV_TAKEOFF]: 'Takeoff',
  [MAV_CMD.NAV_SPLINE_WAYPOINT]: 'Spline Waypoint',
  [MAV_CMD.NAV_DELAY]: 'Delay',
  [MAV_CMD.DO_CHANGE_SPEED]: 'Change Speed',
  [MAV_CMD.DO_SET_HOME]: 'Set Home',
  [MAV_CMD.DO_JUMP]: 'Jump',
  [MAV_CMD.DO_SET_SERVO]: 'Set Servo',
  [MAV_CMD.DO_SET_RELAY]: 'Set Relay',
  [MAV_CMD.DO_DIGICAM_CONTROL]: 'Camera Trigger',
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export const useMissionStore = create<MissionState>((set, get) => ({
  waypoints: [],
  selectedWaypointId: null,
  currentWaypoint: 0,
  homePosition: null,
  surveyAreas: [],
  missionName: 'Untitled Mission',
  isDirty: false,
  filePath: null,

  addWaypoint: (waypoint) =>
    set((state) => {
      const newWaypoint: Waypoint = {
        ...waypoint,
        id: generateId(),
        seq: state.waypoints.length,
      };
      return {
        waypoints: [...state.waypoints, newWaypoint],
        isDirty: true,
      };
    }),

  removeWaypoint: (id) =>
    set((state) => {
      const waypoints = state.waypoints
        .filter((wp) => wp.id !== id)
        .map((wp, index) => ({ ...wp, seq: index }));
      return {
        waypoints,
        selectedWaypointId:
          state.selectedWaypointId === id ? null : state.selectedWaypointId,
        isDirty: true,
      };
    }),

  updateWaypoint: (id, updates) =>
    set((state) => ({
      waypoints: state.waypoints.map((wp) =>
        wp.id === id ? { ...wp, ...updates } : wp
      ),
      isDirty: true,
    })),

  selectWaypoint: (id) => set({ selectedWaypointId: id }),

  reorderWaypoints: (fromIndex, toIndex) =>
    set((state) => {
      const waypoints = [...state.waypoints];
      const [removed] = waypoints.splice(fromIndex, 1);
      waypoints.splice(toIndex, 0, removed);
      return {
        waypoints: waypoints.map((wp, index) => ({ ...wp, seq: index })),
        isDirty: true,
      };
    }),

  setCurrentWaypoint: (seq) => set({ currentWaypoint: seq }),

  setHomePosition: (position) =>
    set({
      homePosition: position,
      isDirty: true,
    }),

  loadMission: (waypoints) =>
    set({
      waypoints: waypoints.map((wp, index) => ({
        ...wp,
        id: wp.id || generateId(),
        seq: index,
      })),
      selectedWaypointId: null,
      currentWaypoint: 0,
      isDirty: false,
    }),

  clearMission: () =>
    set({
      waypoints: [],
      selectedWaypointId: null,
      currentWaypoint: 0,
      homePosition: null,
      surveyAreas: [],
      missionName: 'Untitled Mission',
      isDirty: false,
      filePath: null,
    }),

  addSurveyArea: (area) =>
    set((state) => ({
      surveyAreas: [...state.surveyAreas, { ...area, id: generateId() }],
      isDirty: true,
    })),

  removeSurveyArea: (id) =>
    set((state) => ({
      surveyAreas: state.surveyAreas.filter((area) => area.id !== id),
      isDirty: true,
    })),

  setMissionName: (name) =>
    set({
      missionName: name,
      isDirty: true,
    }),

  setFilePath: (path) => set({ filePath: path }),

  markClean: () => set({ isDirty: false }),
}));
