import * as fs from 'fs';
import { MAVLinkManager } from '../mavlink/MAVLinkManager';

export interface Waypoint {
  seq: number;
  frame: number;
  command: number;
  current: number;
  autocontinue: number;
  param1: number;
  param2: number;
  param3: number;
  param4: number;
  lat: number;
  lon: number;
  alt: number;
}

// MAVLink command IDs
const MAV_CMD = {
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
  DO_SET_SERVO: 183,
  DO_SET_RELAY: 181,
  DO_REPEAT_SERVO: 184,
  DO_DIGICAM_CONTROL: 203,
  DO_MOUNT_CONTROL: 205,
  DO_VTOL_TRANSITION: 3000,
};

// MAV_FRAME definitions
const MAV_FRAME = {
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
};

export class MissionManager {
  private mavlinkManager: MAVLinkManager;
  private missionItems: Waypoint[] = [];
  private uploadInProgress = false;
  private downloadInProgress = false;
  private currentUploadIndex = 0;

  constructor(mavlinkManager: MAVLinkManager) {
    this.mavlinkManager = mavlinkManager;
  }

  async uploadMission(waypoints: unknown[]): Promise<void> {
    if (this.uploadInProgress) {
      throw new Error('Mission upload already in progress');
    }

    this.missionItems = this.convertToWaypoints(waypoints);
    this.uploadInProgress = true;
    this.currentUploadIndex = 0;

    try {
      // First, send mission count
      await this.mavlinkManager.sendMissionCount(this.missionItems.length);

      // Wait for MISSION_REQUEST messages from vehicle
      // The vehicle will request each item sequentially
      // This is handled by the MAVLinkManager event system

      // For now, send all items (simplified implementation)
      for (const item of this.missionItems) {
        await this.mavlinkManager.sendMissionItem(item);
        await this.delay(50); // Small delay between items
      }
    } finally {
      this.uploadInProgress = false;
    }
  }

  async downloadMission(): Promise<Waypoint[]> {
    if (this.downloadInProgress) {
      throw new Error('Mission download already in progress');
    }

    this.downloadInProgress = true;
    this.missionItems = [];

    try {
      await this.mavlinkManager.requestMissionList();

      // In a full implementation, we would wait for MISSION_COUNT
      // then request each item with MISSION_REQUEST_INT
      // For now, return empty array and let the UI handle async updates
      await this.delay(1000);

      return this.missionItems;
    } finally {
      this.downloadInProgress = false;
    }
  }

  async clearMission(): Promise<void> {
    await this.mavlinkManager.clearMission();
    this.missionItems = [];
  }

  async loadFromFile(filePath: string): Promise<Waypoint[]> {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');

    const waypoints: Waypoint[] = [];

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || line.trim() === '') continue;

      // Skip header line (QGC WPL 110 or similar)
      if (line.startsWith('QGC')) continue;

      const parts = line.trim().split(/\s+/);

      if (parts.length >= 12) {
        const waypoint: Waypoint = {
          seq: parseInt(parts[0], 10),
          current: parseInt(parts[1], 10),
          frame: parseInt(parts[2], 10),
          command: parseInt(parts[3], 10),
          param1: parseFloat(parts[4]),
          param2: parseFloat(parts[5]),
          param3: parseFloat(parts[6]),
          param4: parseFloat(parts[7]),
          lat: parseFloat(parts[8]),
          lon: parseFloat(parts[9]),
          alt: parseFloat(parts[10]),
          autocontinue: parseInt(parts[11], 10),
        };

        waypoints.push(waypoint);
      }
    }

    this.missionItems = waypoints;
    return waypoints;
  }

  async saveToFile(filePath: string, waypoints: unknown[]): Promise<void> {
    const items = this.convertToWaypoints(waypoints);

    const lines: string[] = ['QGC WPL 110'];

    for (const wp of items) {
      const line = [
        wp.seq,
        wp.current,
        wp.frame,
        wp.command,
        wp.param1.toFixed(6),
        wp.param2.toFixed(6),
        wp.param3.toFixed(6),
        wp.param4.toFixed(6),
        wp.lat.toFixed(8),
        wp.lon.toFixed(8),
        wp.alt.toFixed(6),
        wp.autocontinue,
      ].join('\t');

      lines.push(line);
    }

    fs.writeFileSync(filePath, lines.join('\n'));
  }

  private convertToWaypoints(items: unknown[]): Waypoint[] {
    return items.map((item: any, index: number) => ({
      seq: item.seq ?? index,
      frame: item.frame ?? MAV_FRAME.GLOBAL_RELATIVE_ALT,
      command: item.command ?? MAV_CMD.NAV_WAYPOINT,
      current: index === 0 ? 1 : 0,
      autocontinue: item.autocontinue ?? 1,
      param1: item.param1 ?? 0,
      param2: item.param2 ?? 0,
      param3: item.param3 ?? 0,
      param4: item.param4 ?? (item.yaw ?? 0),
      lat: item.lat ?? item.latitude ?? 0,
      lon: item.lon ?? item.longitude ?? 0,
      alt: item.alt ?? item.altitude ?? 0,
    }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Generate survey (grid) pattern
  generateSurveyPattern(
    bounds: { north: number; south: number; east: number; west: number },
    altitude: number,
    spacing: number,
    angle: number = 0
  ): Waypoint[] {
    const waypoints: Waypoint[] = [];

    // Home position
    waypoints.push({
      seq: 0,
      frame: MAV_FRAME.GLOBAL,
      command: MAV_CMD.NAV_WAYPOINT,
      current: 1,
      autocontinue: 1,
      param1: 0,
      param2: 0,
      param3: 0,
      param4: 0,
      lat: (bounds.north + bounds.south) / 2,
      lon: (bounds.east + bounds.west) / 2,
      alt: altitude,
    });

    // Takeoff
    waypoints.push({
      seq: 1,
      frame: MAV_FRAME.GLOBAL_RELATIVE_ALT,
      command: MAV_CMD.NAV_TAKEOFF,
      current: 0,
      autocontinue: 1,
      param1: 0,
      param2: 0,
      param3: 0,
      param4: 0,
      lat: (bounds.north + bounds.south) / 2,
      lon: (bounds.east + bounds.west) / 2,
      alt: altitude,
    });

    // Calculate grid lines
    const latRange = bounds.north - bounds.south;
    const lonRange = bounds.east - bounds.west;

    // Convert spacing from meters to degrees (approximate)
    const latSpacing = spacing / 111000; // 1 degree lat ≈ 111km

    let seq = 2;
    let goingEast = true;
    let currentLat = bounds.south;

    while (currentLat <= bounds.north) {
      if (goingEast) {
        waypoints.push({
          seq: seq++,
          frame: MAV_FRAME.GLOBAL_RELATIVE_ALT,
          command: MAV_CMD.NAV_WAYPOINT,
          current: 0,
          autocontinue: 1,
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
          lat: currentLat,
          lon: bounds.west,
          alt: altitude,
        });

        waypoints.push({
          seq: seq++,
          frame: MAV_FRAME.GLOBAL_RELATIVE_ALT,
          command: MAV_CMD.NAV_WAYPOINT,
          current: 0,
          autocontinue: 1,
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
          lat: currentLat,
          lon: bounds.east,
          alt: altitude,
        });
      } else {
        waypoints.push({
          seq: seq++,
          frame: MAV_FRAME.GLOBAL_RELATIVE_ALT,
          command: MAV_CMD.NAV_WAYPOINT,
          current: 0,
          autocontinue: 1,
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
          lat: currentLat,
          lon: bounds.east,
          alt: altitude,
        });

        waypoints.push({
          seq: seq++,
          frame: MAV_FRAME.GLOBAL_RELATIVE_ALT,
          command: MAV_CMD.NAV_WAYPOINT,
          current: 0,
          autocontinue: 1,
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
          lat: currentLat,
          lon: bounds.west,
          alt: altitude,
        });
      }

      currentLat += latSpacing;
      goingEast = !goingEast;
    }

    // Return to launch
    waypoints.push({
      seq: seq++,
      frame: MAV_FRAME.GLOBAL_RELATIVE_ALT,
      command: MAV_CMD.NAV_RETURN_TO_LAUNCH,
      current: 0,
      autocontinue: 1,
      param1: 0,
      param2: 0,
      param3: 0,
      param4: 0,
      lat: 0,
      lon: 0,
      alt: 0,
    });

    return waypoints;
  }
}
