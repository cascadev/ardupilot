# ArduPilot GCS

A modern Windows desktop application for ArduPilot drone mission planning and control, similar to DJI Terra.

![ArduPilot GCS](assets/screenshot.png)

## Features

- **Mission Planning**: Create waypoint missions with an intuitive map interface
- **Real-time Telemetry**: Monitor attitude, position, battery, and GPS status
- **MAVLink Support**: Full MAVLink protocol support for ArduPilot vehicles
- **Survey Patterns**: Generate grid and corridor survey missions
- **Flight Modes**: Switch between flight modes and arm/disarm
- **Parameter Management**: View and modify vehicle parameters
- **Cross-platform**: Built with Electron for Windows (primary), macOS, and Linux

## Screenshots

### Mission Planner
Plan waypoint missions with drag-and-drop simplicity on an interactive map.

### Flight Data
Monitor real-time telemetry including attitude, speed, altitude, and battery status.

### Parameters
View and modify vehicle parameters with search and filtering.

## Installation

### Pre-built Installer (Windows)

Download the latest release from the [Releases](releases) page and run the installer.

### Build from Source

#### Prerequisites

- Node.js 18+
- npm or yarn
- Git

#### Steps

1. Clone the repository:
```bash
git clone https://github.com/ArduPilot/ardupilot.git
cd ardupilot/Tools/ArduPilotGCS
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run dev
```

4. Build for production:
```bash
npm run dist:win
```

The installer will be created in the `release` folder.

## Usage

### Connecting to a Vehicle

1. Click the connection button in the top-right corner
2. Select your connection type:
   - **UDP**: For SITL simulation or network connections (default port: 14550)
   - **Serial**: For direct USB/serial connections
   - **TCP**: For TCP/IP connections
3. Click "Connect"

### Creating a Mission

1. Navigate to the Mission Planner view
2. Click the "+" button in the toolbar
3. Click on the map to add waypoints
4. Adjust waypoint properties in the right panel
5. Upload the mission to your vehicle

### Flight Controls

- **Arm/Disarm**: Toggle vehicle arming state
- **Takeoff**: Initiate automatic takeoff
- **Land**: Command vehicle to land
- **RTL**: Return to launch position

## Connection Types

### SITL (Software In The Loop)

For testing with ArduPilot SITL:

```bash
# Start SITL with UDP output
sim_vehicle.py -v ArduCopter --map --console

# Connect GCS on UDP port 14550
```

### Serial Connection

Connect directly to a flight controller via USB:

1. Select the COM port from the dropdown
2. Set the baud rate (typically 115200)
3. Click Connect

### Network Connection

For vehicles with telemetry radios or network bridges:

1. Enter the host IP address
2. Enter the port number
3. Click Connect

## Development

### Project Structure

```
ArduPilotGCS/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # Application entry point
│   │   ├── preload.ts  # Preload script for IPC
│   │   ├── mavlink/    # MAVLink communication
│   │   ├── mission/    # Mission management
│   │   └── settings/   # Settings management
│   ├── renderer/       # React frontend
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── store/      # Zustand stores
│   │   └── styles/     # CSS styles
│   └── shared/         # Shared types
├── assets/             # Application assets
├── package.json
└── README.md
```

### Technologies

- **Electron**: Desktop application framework
- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS
- **Zustand**: State management
- **Leaflet**: Interactive maps
- **MAVLink**: Drone communication protocol

### Building

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Create Windows installer
npm run dist:win
```

## MAVLink Protocol

This application implements MAVLink 1.0/2.0 protocol for communication with ArduPilot vehicles. Key message types supported:

- HEARTBEAT
- ATTITUDE
- GLOBAL_POSITION_INT
- GPS_RAW_INT
- VFR_HUD
- BATTERY_STATUS
- SYS_STATUS
- STATUSTEXT
- MISSION_* (waypoint transfer)
- COMMAND_LONG/COMMAND_ACK

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [ArduPilot](https://ardupilot.org/) - Open source autopilot platform
- [MAVLink](https://mavlink.io/) - Communication protocol
- [Electron](https://www.electronjs.org/) - Desktop application framework
- [React](https://reactjs.org/) - UI framework
- [OpenStreetMap](https://www.openstreetmap.org/) - Map tiles

## Support

- [ArduPilot Forum](https://discuss.ardupilot.org/)
- [GitHub Issues](https://github.com/ArduPilot/ardupilot/issues)
- [Discord](https://ardupilot.org/discord)
