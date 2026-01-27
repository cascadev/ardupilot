import { EventEmitter } from 'events';
import * as dgram from 'dgram';

// MAVLink message IDs
const MAVLINK_MSG_ID = {
  HEARTBEAT: 0,
  SYS_STATUS: 1,
  SYSTEM_TIME: 2,
  GPS_RAW_INT: 24,
  ATTITUDE: 30,
  GLOBAL_POSITION_INT: 33,
  MISSION_CURRENT: 42,
  MISSION_COUNT: 44,
  MISSION_ITEM_INT: 73,
  MISSION_REQUEST_INT: 51,
  MISSION_ACK: 47,
  MISSION_CLEAR_ALL: 45,
  VFR_HUD: 74,
  COMMAND_LONG: 76,
  COMMAND_ACK: 77,
  BATTERY_STATUS: 147,
  STATUSTEXT: 253,
};

// MAVLink component IDs
const MAV_COMPONENT = {
  AUTOPILOT: 1,
  GCS: 190,
};

// MAVLink system ID for this GCS
const GCS_SYSTEM_ID = 255;

// MAV_CMD definitions
const MAV_CMD = {
  NAV_WAYPOINT: 16,
  NAV_LOITER_UNLIM: 17,
  NAV_LOITER_TURNS: 18,
  NAV_LOITER_TIME: 19,
  NAV_RETURN_TO_LAUNCH: 20,
  NAV_LAND: 21,
  NAV_TAKEOFF: 22,
  DO_CHANGE_SPEED: 178,
  DO_SET_HOME: 179,
  DO_SET_SERVO: 183,
  DO_SET_RELAY: 181,
  MISSION_START: 300,
  COMPONENT_ARM_DISARM: 400,
  DO_SET_MODE: 176,
  PREFLIGHT_CALIBRATION: 241,
  PREFLIGHT_REBOOT_SHUTDOWN: 246,
};

// Flight modes for Copter
const COPTER_MODE = {
  STABILIZE: 0,
  ACRO: 1,
  ALT_HOLD: 2,
  AUTO: 3,
  GUIDED: 4,
  LOITER: 5,
  RTL: 6,
  CIRCLE: 7,
  LAND: 9,
  DRIFT: 11,
  SPORT: 13,
  FLIP: 14,
  AUTOTUNE: 15,
  POSHOLD: 16,
  BRAKE: 17,
  THROW: 18,
  AVOID_ADSB: 19,
  GUIDED_NOGPS: 20,
  SMART_RTL: 21,
  FLOWHOLD: 22,
  FOLLOW: 23,
  ZIGZAG: 24,
  SYSTEMID: 25,
  AUTOROTATE: 26,
  AUTO_RTL: 27,
};

interface ConnectionParams {
  host?: string;
  port?: number;
  baudRate?: number;
  comPort?: string;
}

interface TelemetryData {
  roll: number;
  pitch: number;
  yaw: number;
  rollSpeed: number;
  pitchSpeed: number;
  yawSpeed: number;
}

interface GlobalPositionData {
  lat: number;
  lon: number;
  alt: number;
  relative_alt: number;
  vx: number;
  vy: number;
  vz: number;
  hdg: number;
}

interface HeartbeatData {
  type: number;
  autopilot: number;
  base_mode: number;
  custom_mode: number;
  system_status: number;
  mavlink_version: number;
}

interface VfrHudData {
  airspeed: number;
  groundspeed: number;
  heading: number;
  throttle: number;
  alt: number;
  climb: number;
}

interface BatteryStatusData {
  voltage: number;
  current: number;
  remaining: number;
}

type EventCallback = (event: string, data: unknown) => void;

export class MAVLinkManager extends EventEmitter {
  private udpSocket: dgram.Socket | null = null;
  private serialPort: unknown = null;
  private connected = false;
  private targetSystem = 1;
  private targetComponent = MAV_COMPONENT.AUTOPILOT;
  private sendCallback: EventCallback;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat = 0;
  private sequenceNumber = 0;
  private remoteAddress: string = '';
  private remotePort: number = 0;

  constructor(sendCallback: EventCallback) {
    super();
    this.sendCallback = sendCallback;
  }

  async connect(connectionType: string, params: ConnectionParams): Promise<void> {
    if (this.connected) {
      await this.disconnect();
    }

    switch (connectionType) {
      case 'udp':
        await this.connectUDP(params);
        break;
      case 'tcp':
        await this.connectTCP(params);
        break;
      case 'serial':
        await this.connectSerial(params);
        break;
      default:
        throw new Error(`Unknown connection type: ${connectionType}`);
    }
  }

  private async connectUDP(params: ConnectionParams): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = params.port || 14550;

      this.udpSocket = dgram.createSocket('udp4');

      this.udpSocket.on('error', (err) => {
        console.error('UDP Socket error:', err);
        this.sendCallback('mavlink:connection_status', { connected: false, error: err.message });
        reject(err);
      });

      this.udpSocket.on('message', (msg, rinfo) => {
        // Store remote info for sending responses
        if (!this.connected) {
          this.remoteAddress = rinfo.address;
          this.remotePort = rinfo.port;
          this.connected = true;
          this.sendCallback('mavlink:connection_status', { connected: true });
          this.startHeartbeat();
        }
        this.parseMAVLinkMessage(msg);
      });

      this.udpSocket.on('listening', () => {
        const address = this.udpSocket?.address();
        console.log(`UDP Socket listening on ${address?.address}:${address?.port}`);
        resolve();
      });

      this.udpSocket.bind(port);
    });
  }

  private async connectTCP(params: ConnectionParams): Promise<void> {
    const host = params.host || '127.0.0.1';
    const port = params.port || 5760;

    // TCP implementation would go here
    // For now, we'll use UDP as the primary connection method
    console.log(`TCP connection to ${host}:${port} - Not yet implemented, using UDP`);
    await this.connectUDP({ port });
  }

  private async connectSerial(params: ConnectionParams): Promise<void> {
    try {
      // Dynamic import for serialport (only available in Electron main process)
      const { SerialPort } = await import('serialport');

      const comPort = params.comPort || 'COM3';
      const baudRate = params.baudRate || 115200;

      this.serialPort = new SerialPort({
        path: comPort,
        baudRate: baudRate,
      });

      (this.serialPort as any).on('open', () => {
        console.log(`Serial port ${comPort} opened`);
        this.connected = true;
        this.sendCallback('mavlink:connection_status', { connected: true });
        this.startHeartbeat();
      });

      (this.serialPort as any).on('data', (data: Buffer) => {
        this.parseMAVLinkMessage(data);
      });

      (this.serialPort as any).on('error', (err: Error) => {
        console.error('Serial port error:', err);
        this.sendCallback('mavlink:connection_status', { connected: false, error: err.message });
      });
    } catch (error) {
      throw new Error(`Failed to open serial port: ${(error as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();

    if (this.udpSocket) {
      this.udpSocket.close();
      this.udpSocket = null;
    }

    if (this.serialPort) {
      try {
        await new Promise<void>((resolve) => {
          (this.serialPort as any).close(() => resolve());
        });
      } catch {
        // Ignore close errors
      }
      this.serialPort = null;
    }

    this.connected = false;
    this.sendCallback('mavlink:connection_status', { connected: false });
  }

  isConnected(): boolean {
    return this.connected;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();

      // Check for timeout (no heartbeat received for 5 seconds)
      if (this.lastHeartbeat > 0 && Date.now() - this.lastHeartbeat > 5000) {
        this.sendCallback('mavlink:connection_status', { connected: true, warning: 'No heartbeat' });
      }
    }, 1000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendHeartbeat(): void {
    // MAVLink 2.0 heartbeat message
    const heartbeat = this.createMAVLinkMessage(MAVLINK_MSG_ID.HEARTBEAT, [
      6,  // type: MAV_TYPE_GCS
      8,  // autopilot: MAV_AUTOPILOT_INVALID
      0,  // base_mode
      0, 0, 0, 0, // custom_mode (uint32)
      0,  // system_status: MAV_STATE_UNINIT
    ]);

    this.sendMessage(heartbeat);
  }

  private createMAVLinkMessage(msgId: number, payload: number[]): Buffer {
    // MAVLink 1.0 message format for simplicity
    const STX = 0xFE; // MAVLink 1.0 start byte
    const payloadLength = payload.length;
    const seq = this.sequenceNumber++ & 0xFF;
    const sysId = GCS_SYSTEM_ID;
    const compId = MAV_COMPONENT.GCS;

    const header = Buffer.from([STX, payloadLength, seq, sysId, compId, msgId]);
    const payloadBuffer = Buffer.from(payload);

    // Calculate CRC
    const crcBuffer = Buffer.concat([
      header.slice(1), // exclude STX
      payloadBuffer,
    ]);

    const crc = this.calculateCRC(crcBuffer, msgId);
    const crcBytes = Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF]);

    return Buffer.concat([header, payloadBuffer, crcBytes]);
  }

  private calculateCRC(buffer: Buffer, msgId: number): number {
    // MAVLink CRC calculation using X.25 CRC
    let crc = 0xFFFF;

    for (const byte of buffer) {
      let tmp = byte ^ (crc & 0xFF);
      tmp ^= (tmp << 4) & 0xFF;
      crc = (crc >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4);
      crc &= 0xFFFF;
    }

    // Add message CRC extra byte
    const crcExtra = this.getCRCExtra(msgId);
    let tmp = crcExtra ^ (crc & 0xFF);
    tmp ^= (tmp << 4) & 0xFF;
    crc = (crc >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4);
    crc &= 0xFFFF;

    return crc;
  }

  private getCRCExtra(msgId: number): number {
    // CRC extra bytes for common message types
    const crcExtras: Record<number, number> = {
      [MAVLINK_MSG_ID.HEARTBEAT]: 50,
      [MAVLINK_MSG_ID.SYS_STATUS]: 124,
      [MAVLINK_MSG_ID.GPS_RAW_INT]: 24,
      [MAVLINK_MSG_ID.ATTITUDE]: 39,
      [MAVLINK_MSG_ID.GLOBAL_POSITION_INT]: 104,
      [MAVLINK_MSG_ID.VFR_HUD]: 20,
      [MAVLINK_MSG_ID.COMMAND_LONG]: 152,
      [MAVLINK_MSG_ID.COMMAND_ACK]: 143,
      [MAVLINK_MSG_ID.MISSION_COUNT]: 221,
      [MAVLINK_MSG_ID.MISSION_ITEM_INT]: 38,
      [MAVLINK_MSG_ID.MISSION_REQUEST_INT]: 196,
      [MAVLINK_MSG_ID.MISSION_ACK]: 153,
      [MAVLINK_MSG_ID.MISSION_CLEAR_ALL]: 232,
      [MAVLINK_MSG_ID.BATTERY_STATUS]: 154,
      [MAVLINK_MSG_ID.STATUSTEXT]: 83,
    };

    return crcExtras[msgId] || 0;
  }

  private sendMessage(message: Buffer): void {
    if (this.udpSocket && this.remoteAddress && this.remotePort) {
      this.udpSocket.send(message, this.remotePort, this.remoteAddress);
    } else if (this.serialPort) {
      (this.serialPort as any).write(message);
    }
  }

  private parseMAVLinkMessage(buffer: Buffer): void {
    let offset = 0;

    while (offset < buffer.length) {
      const stx = buffer[offset];

      // Look for MAVLink 1.0 start byte
      if (stx === 0xFE && offset + 6 <= buffer.length) {
        const payloadLength = buffer[offset + 1];
        const msgLength = 6 + payloadLength + 2; // header + payload + CRC

        if (offset + msgLength <= buffer.length) {
          const msgId = buffer[offset + 5];
          const sysId = buffer[offset + 3];
          const payload = buffer.slice(offset + 6, offset + 6 + payloadLength);

          this.handleMessage(msgId, sysId, payload);
          offset += msgLength;
          continue;
        }
      }

      // Look for MAVLink 2.0 start byte
      if (stx === 0xFD && offset + 10 <= buffer.length) {
        const payloadLength = buffer[offset + 1];
        const msgLength = 10 + payloadLength + 2; // header + payload + CRC

        if (offset + msgLength <= buffer.length) {
          const msgId = buffer[offset + 7] | (buffer[offset + 8] << 8) | (buffer[offset + 9] << 16);
          const sysId = buffer[offset + 5];
          const payload = buffer.slice(offset + 10, offset + 10 + payloadLength);

          this.handleMessage(msgId, sysId, payload);
          offset += msgLength;
          continue;
        }
      }

      offset++;
    }
  }

  private handleMessage(msgId: number, sysId: number, payload: Buffer): void {
    // Update target system from received messages
    if (sysId !== GCS_SYSTEM_ID && sysId !== 0) {
      this.targetSystem = sysId;
    }

    switch (msgId) {
      case MAVLINK_MSG_ID.HEARTBEAT:
        this.handleHeartbeat(payload);
        break;
      case MAVLINK_MSG_ID.SYS_STATUS:
        this.handleSysStatus(payload);
        break;
      case MAVLINK_MSG_ID.ATTITUDE:
        this.handleAttitude(payload);
        break;
      case MAVLINK_MSG_ID.GLOBAL_POSITION_INT:
        this.handleGlobalPosition(payload);
        break;
      case MAVLINK_MSG_ID.GPS_RAW_INT:
        this.handleGpsRaw(payload);
        break;
      case MAVLINK_MSG_ID.VFR_HUD:
        this.handleVfrHud(payload);
        break;
      case MAVLINK_MSG_ID.BATTERY_STATUS:
        this.handleBatteryStatus(payload);
        break;
      case MAVLINK_MSG_ID.STATUSTEXT:
        this.handleStatusText(payload);
        break;
      case MAVLINK_MSG_ID.MISSION_COUNT:
        this.handleMissionCount(payload);
        break;
      case MAVLINK_MSG_ID.MISSION_ITEM_INT:
        this.handleMissionItem(payload);
        break;
      case MAVLINK_MSG_ID.MISSION_ACK:
        this.handleMissionAck(payload);
        break;
      case MAVLINK_MSG_ID.MISSION_CURRENT:
        this.handleMissionCurrent(payload);
        break;
      case MAVLINK_MSG_ID.COMMAND_ACK:
        this.handleCommandAck(payload);
        break;
    }
  }

  private handleHeartbeat(payload: Buffer): void {
    this.lastHeartbeat = Date.now();

    const data: HeartbeatData = {
      type: payload[0],
      autopilot: payload[1],
      base_mode: payload[2],
      custom_mode: payload.readUInt32LE(3),
      system_status: payload[7],
      mavlink_version: payload[8],
    };

    this.sendCallback('mavlink:heartbeat', data);
  }

  private handleSysStatus(payload: Buffer): void {
    const data = {
      onboard_control_sensors_present: payload.readUInt32LE(0),
      onboard_control_sensors_enabled: payload.readUInt32LE(4),
      onboard_control_sensors_health: payload.readUInt32LE(8),
      load: payload.readUInt16LE(12),
      voltage_battery: payload.readUInt16LE(14),
      current_battery: payload.readInt16LE(16),
      battery_remaining: payload.readInt8(18),
    };

    this.sendCallback('mavlink:sys_status', data);
  }

  private handleAttitude(payload: Buffer): void {
    const data: TelemetryData = {
      roll: payload.readFloatLE(4),
      pitch: payload.readFloatLE(8),
      yaw: payload.readFloatLE(12),
      rollSpeed: payload.readFloatLE(16),
      pitchSpeed: payload.readFloatLE(20),
      yawSpeed: payload.readFloatLE(24),
    };

    this.sendCallback('mavlink:attitude', data);
    this.sendCallback('mavlink:telemetry', data);
  }

  private handleGlobalPosition(payload: Buffer): void {
    const data: GlobalPositionData = {
      lat: payload.readInt32LE(4) / 1e7,
      lon: payload.readInt32LE(8) / 1e7,
      alt: payload.readInt32LE(12) / 1000, // mm to m
      relative_alt: payload.readInt32LE(16) / 1000,
      vx: payload.readInt16LE(20) / 100, // cm/s to m/s
      vy: payload.readInt16LE(22) / 100,
      vz: payload.readInt16LE(24) / 100,
      hdg: payload.readUInt16LE(26) / 100, // cdeg to deg
    };

    this.sendCallback('mavlink:global_position', data);
  }

  private handleGpsRaw(payload: Buffer): void {
    const data = {
      fix_type: payload[28],
      lat: payload.readInt32LE(8) / 1e7,
      lon: payload.readInt32LE(12) / 1e7,
      alt: payload.readInt32LE(16) / 1000,
      eph: payload.readUInt16LE(20),
      epv: payload.readUInt16LE(22),
      vel: payload.readUInt16LE(24) / 100,
      cog: payload.readUInt16LE(26) / 100,
      satellites_visible: payload[29],
    };

    this.sendCallback('mavlink:gps_raw', data);
  }

  private handleVfrHud(payload: Buffer): void {
    const data: VfrHudData = {
      airspeed: payload.readFloatLE(0),
      groundspeed: payload.readFloatLE(4),
      heading: payload.readInt16LE(8),
      throttle: payload.readUInt16LE(10),
      alt: payload.readFloatLE(12),
      climb: payload.readFloatLE(16),
    };

    this.sendCallback('mavlink:vfr_hud', data);
  }

  private handleBatteryStatus(payload: Buffer): void {
    // Battery voltage is at different offsets depending on MAVLink version
    const voltages: number[] = [];
    for (let i = 0; i < 10; i++) {
      const voltage = payload.readUInt16LE(10 + i * 2);
      if (voltage !== 0xFFFF) {
        voltages.push(voltage);
      }
    }

    const data: BatteryStatusData = {
      voltage: voltages.length > 0 ? voltages.reduce((a, b) => a + b, 0) / 1000 : 0,
      current: payload.readInt16LE(30) / 100,
      remaining: payload.readInt8(35),
    };

    this.sendCallback('mavlink:battery_status', data);
  }

  private handleStatusText(payload: Buffer): void {
    const severity = payload[0];
    const textBytes = payload.slice(1);
    const text = textBytes.toString('utf8').replace(/\0/g, '').trim();

    const severityLabels = [
      'EMERGENCY', 'ALERT', 'CRITICAL', 'ERROR',
      'WARNING', 'NOTICE', 'INFO', 'DEBUG'
    ];

    this.sendCallback('mavlink:statustext', {
      severity,
      severityLabel: severityLabels[severity] || 'UNKNOWN',
      text,
    });
  }

  private handleMissionCount(payload: Buffer): void {
    const count = payload.readUInt16LE(0);
    this.sendCallback('mavlink:mission_count', { count });
  }

  private handleMissionItem(payload: Buffer): void {
    const item = {
      seq: payload.readUInt16LE(30),
      frame: payload[28],
      command: payload.readUInt16LE(26),
      current: payload[29],
      autocontinue: payload[31],
      param1: payload.readFloatLE(0),
      param2: payload.readFloatLE(4),
      param3: payload.readFloatLE(8),
      param4: payload.readFloatLE(12),
      x: payload.readInt32LE(16) / 1e7,
      y: payload.readInt32LE(20) / 1e7,
      z: payload.readFloatLE(24),
    };

    this.sendCallback('mavlink:mission_item', item);
  }

  private handleMissionAck(payload: Buffer): void {
    const result = payload[2];
    const missionType = payload.length > 3 ? payload[3] : 0;

    this.sendCallback('mavlink:mission_ack', {
      result,
      missionType,
      success: result === 0,
    });
  }

  private handleMissionCurrent(payload: Buffer): void {
    const seq = payload.readUInt16LE(0);
    this.sendCallback('mavlink:mission_progress', { currentWaypoint: seq });
  }

  private handleCommandAck(payload: Buffer): void {
    const command = payload.readUInt16LE(0);
    const result = payload[2];

    this.sendCallback('mavlink:command_ack', {
      command,
      result,
      success: result === 0,
    });
  }

  async sendCommand(command: string, params: Record<string, unknown>): Promise<void> {
    switch (command) {
      case 'arm':
        await this.sendArmDisarm(true);
        break;
      case 'disarm':
        await this.sendArmDisarm(false);
        break;
      case 'takeoff':
        await this.sendTakeoff(params.altitude as number || 10);
        break;
      case 'land':
        await this.sendLand();
        break;
      case 'rtl':
        await this.sendRTL();
        break;
      case 'setMode':
        await this.sendSetMode(params.mode as number);
        break;
      case 'startMission':
        await this.sendStartMission();
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  private sendCommandLong(
    command: number,
    param1 = 0,
    param2 = 0,
    param3 = 0,
    param4 = 0,
    param5 = 0,
    param6 = 0,
    param7 = 0
  ): void {
    const payload = Buffer.alloc(33);
    payload.writeFloatLE(param1, 0);
    payload.writeFloatLE(param2, 4);
    payload.writeFloatLE(param3, 8);
    payload.writeFloatLE(param4, 12);
    payload.writeFloatLE(param5, 16);
    payload.writeFloatLE(param6, 20);
    payload.writeFloatLE(param7, 24);
    payload.writeUInt16LE(command, 28);
    payload.writeUInt8(this.targetSystem, 30);
    payload.writeUInt8(this.targetComponent, 31);
    payload.writeUInt8(0, 32); // confirmation

    const message = this.createMAVLinkMessage(MAVLINK_MSG_ID.COMMAND_LONG, [...payload]);
    this.sendMessage(message);
  }

  private async sendArmDisarm(arm: boolean): Promise<void> {
    this.sendCommandLong(MAV_CMD.COMPONENT_ARM_DISARM, arm ? 1 : 0, 0, 0, 0, 0, 0, 0);
  }

  private async sendTakeoff(altitude: number): Promise<void> {
    this.sendCommandLong(MAV_CMD.NAV_TAKEOFF, 0, 0, 0, 0, 0, 0, altitude);
  }

  private async sendLand(): Promise<void> {
    this.sendCommandLong(MAV_CMD.NAV_LAND, 0, 0, 0, 0, 0, 0, 0);
  }

  private async sendRTL(): Promise<void> {
    // Set mode to RTL
    await this.sendSetMode(COPTER_MODE.RTL);
  }

  private async sendSetMode(mode: number): Promise<void> {
    this.sendCommandLong(MAV_CMD.DO_SET_MODE, 1, mode, 0, 0, 0, 0, 0);
  }

  private async sendStartMission(): Promise<void> {
    this.sendCommandLong(MAV_CMD.MISSION_START, 0, 0, 0, 0, 0, 0, 0);
  }

  async getAvailablePorts(): Promise<Array<{ path: string; manufacturer?: string }>> {
    try {
      const { SerialPort } = await import('serialport');
      const ports = await SerialPort.list();
      return ports.map((port) => ({
        path: port.path,
        manufacturer: port.manufacturer,
      }));
    } catch {
      return [];
    }
  }

  // Mission upload/download methods
  async requestMissionList(): Promise<void> {
    const payload = Buffer.alloc(4);
    payload.writeUInt8(this.targetSystem, 0);
    payload.writeUInt8(this.targetComponent, 1);
    payload.writeUInt8(0, 2); // mission_type: MAV_MISSION_TYPE_MISSION

    // Request mission count (msg id 43)
    const message = this.createMAVLinkMessage(43, [...payload]);
    this.sendMessage(message);
  }

  async sendMissionCount(count: number): Promise<void> {
    const payload = Buffer.alloc(5);
    payload.writeUInt16LE(count, 0);
    payload.writeUInt8(this.targetSystem, 2);
    payload.writeUInt8(this.targetComponent, 3);
    payload.writeUInt8(0, 4); // mission_type

    const message = this.createMAVLinkMessage(MAVLINK_MSG_ID.MISSION_COUNT, [...payload]);
    this.sendMessage(message);
  }

  async sendMissionItem(waypoint: {
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
  }): Promise<void> {
    const payload = Buffer.alloc(37);
    payload.writeFloatLE(waypoint.param1, 0);
    payload.writeFloatLE(waypoint.param2, 4);
    payload.writeFloatLE(waypoint.param3, 8);
    payload.writeFloatLE(waypoint.param4, 12);
    payload.writeInt32LE(Math.round(waypoint.lat * 1e7), 16);
    payload.writeInt32LE(Math.round(waypoint.lon * 1e7), 20);
    payload.writeFloatLE(waypoint.alt, 24);
    payload.writeUInt16LE(waypoint.command, 28);
    payload.writeUInt16LE(waypoint.seq, 30);
    payload.writeUInt8(waypoint.frame, 32);
    payload.writeUInt8(waypoint.current, 33);
    payload.writeUInt8(waypoint.autocontinue, 34);
    payload.writeUInt8(this.targetSystem, 35);
    payload.writeUInt8(this.targetComponent, 36);

    const message = this.createMAVLinkMessage(MAVLINK_MSG_ID.MISSION_ITEM_INT, [...payload]);
    this.sendMessage(message);
  }

  async clearMission(): Promise<void> {
    const payload = Buffer.alloc(3);
    payload.writeUInt8(this.targetSystem, 0);
    payload.writeUInt8(this.targetComponent, 1);
    payload.writeUInt8(0, 2); // mission_type

    const message = this.createMAVLinkMessage(MAVLINK_MSG_ID.MISSION_CLEAR_ALL, [...payload]);
    this.sendMessage(message);
  }
}
