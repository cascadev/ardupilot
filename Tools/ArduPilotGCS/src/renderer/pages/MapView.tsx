import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useDroneStore } from '../store/droneStore';
import { useMissionStore, MAV_CMD, MAV_FRAME, COMMAND_NAMES, Waypoint } from '../store/missionStore';
import TelemetryPanel from '../components/TelemetryPanel';
import WaypointPanel from '../components/WaypointPanel';
import ActionBar from '../components/ActionBar';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Play,
  Square,
  RotateCcw,
  Grid,
  Home,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom drone icon
const droneIcon = L.divIcon({
  className: 'drone-marker',
  html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-8 h-8 text-sky-400">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Create waypoint icon
const createWaypointIcon = (seq: number, isActive: boolean, isSelected: boolean) => {
  return L.divIcon({
    className: 'waypoint-marker-container',
    html: `<div class="waypoint-marker ${isActive ? 'active' : ''} ${isSelected ? 'ring-2 ring-sky-400' : ''}"
           style="background: ${isActive ? '#22c55e' : '#0ea5e9'}">
      ${seq}
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Home icon
const homeIcon = L.divIcon({
  className: 'home-marker',
  html: `<div class="w-6 h-6 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" class="w-4 h-4">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Component to handle map events
const MapEventHandler: React.FC<{ onMapClick: (lat: number, lon: number) => void }> = ({ onMapClick }) => {
  const { waypoints } = useMissionStore();
  const map = useMap();

  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  // Fit bounds to waypoints when they change
  useEffect(() => {
    if (waypoints.length > 1) {
      const bounds = L.latLngBounds(waypoints.map((wp) => [wp.lat, wp.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [waypoints.length]);

  return null;
};

// Component to follow drone position
const DroneFollower: React.FC<{ follow: boolean }> = ({ follow }) => {
  const { position } = useDroneStore();
  const map = useMap();

  useEffect(() => {
    if (follow && position.lat !== 0 && position.lon !== 0) {
      map.setView([position.lat, position.lon], map.getZoom());
    }
  }, [position.lat, position.lon, follow]);

  return null;
};

const MapView: React.FC = () => {
  const { position, attitude, connected } = useDroneStore();
  const {
    waypoints,
    selectedWaypointId,
    currentWaypoint,
    homePosition,
    addWaypoint,
    removeWaypoint,
    selectWaypoint,
    clearMission,
    setHomePosition,
  } = useMissionStore();

  const [editMode, setEditMode] = useState<'waypoint' | 'survey' | null>(null);
  const [followDrone, setFollowDrone] = useState(false);
  const [defaultAltitude, setDefaultAltitude] = useState(50);

  const handleMapClick = (lat: number, lon: number) => {
    if (editMode === 'waypoint') {
      addWaypoint({
        frame: MAV_FRAME.GLOBAL_RELATIVE_ALT,
        command: MAV_CMD.NAV_WAYPOINT,
        param1: 0,
        param2: 0,
        param3: 0,
        param4: 0,
        lat,
        lon,
        alt: defaultAltitude,
        autocontinue: 1,
      });
    }
  };

  const handleSetHome = () => {
    if (position.lat !== 0 && position.lon !== 0) {
      setHomePosition({
        lat: position.lat,
        lon: position.lon,
        alt: position.alt,
      });
    }
  };

  const handleUploadMission = async () => {
    if (window.electronAPI && waypoints.length > 0) {
      const result = await window.electronAPI.mission.upload(waypoints);
      if (!result.success) {
        console.error('Failed to upload mission:', result.error);
      }
    }
  };

  const handleDownloadMission = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.mission.download();
      if (result.success && result.mission) {
        // Mission will be loaded through the store
      }
    }
  };

  const handleStartMission = async () => {
    if (window.electronAPI && connected) {
      await window.electronAPI.mavlink.sendCommand('setMode', { mode: 3 }); // AUTO mode
      await window.electronAPI.mavlink.sendCommand('startMission', {});
    }
  };

  // Create polyline path from waypoints
  const flightPath = waypoints
    .filter((wp) => wp.command === MAV_CMD.NAV_WAYPOINT || wp.command === MAV_CMD.NAV_TAKEOFF)
    .map((wp) => [wp.lat, wp.lon] as [number, number]);

  // Default map center
  const mapCenter: [number, number] = position.lat !== 0
    ? [position.lat, position.lon]
    : homePosition
      ? [homePosition.lat, homePosition.lon]
      : [37.7749, -122.4194];

  return (
    <div className="h-full flex">
      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={15}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapEventHandler onMapClick={handleMapClick} />
          <DroneFollower follow={followDrone} />

          {/* Home Position */}
          {homePosition && (
            <Marker
              position={[homePosition.lat, homePosition.lon]}
              icon={homeIcon}
            />
          )}

          {/* Waypoints */}
          {waypoints.map((wp) => (
            <Marker
              key={wp.id}
              position={[wp.lat, wp.lon]}
              icon={createWaypointIcon(
                wp.seq,
                wp.seq === currentWaypoint,
                wp.id === selectedWaypointId
              )}
              eventHandlers={{
                click: () => selectWaypoint(wp.id),
              }}
            />
          ))}

          {/* Flight Path */}
          {flightPath.length > 1 && (
            <Polyline
              positions={flightPath}
              color="#0ea5e9"
              weight={3}
              opacity={0.8}
              dashArray="10, 5"
            />
          )}

          {/* Drone Marker */}
          {connected && position.lat !== 0 && (
            <Marker
              position={[position.lat, position.lon]}
              icon={droneIcon}
              rotationAngle={attitude.yaw}
              rotationOrigin="center"
            />
          )}
        </MapContainer>

        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
          <div className="glass-panel p-2 flex flex-col gap-1">
            <button
              onClick={() => setEditMode(editMode === 'waypoint' ? null : 'waypoint')}
              className={`btn ${editMode === 'waypoint' ? 'btn-primary' : 'btn-ghost'}`}
              title="Add Waypoint"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={handleSetHome}
              className="btn btn-ghost"
              title="Set Home Position"
              disabled={!connected || position.lat === 0}
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => setEditMode(editMode === 'survey' ? null : 'survey')}
              className={`btn ${editMode === 'survey' ? 'btn-primary' : 'btn-ghost'}`}
              title="Survey Grid"
            >
              <Grid className="w-5 h-5" />
            </button>
            <div className="border-t border-slate-600 my-1" />
            <button
              onClick={() => clearMission()}
              className="btn btn-ghost text-red-400 hover:text-red-300"
              title="Clear Mission"
              disabled={waypoints.length === 0}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="glass-panel p-2 flex flex-col gap-1">
            <button
              onClick={handleUploadMission}
              className="btn btn-ghost"
              title="Upload Mission"
              disabled={!connected || waypoints.length === 0}
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownloadMission}
              className="btn btn-ghost"
              title="Download Mission"
              disabled={!connected}
            >
              <Download className="w-5 h-5" />
            </button>
          </div>

          <div className="glass-panel p-2 flex flex-col gap-1">
            <button
              onClick={handleStartMission}
              className="btn btn-success"
              title="Start Mission"
              disabled={!connected || waypoints.length === 0}
            >
              <Play className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.electronAPI?.mavlink.sendCommand('rtl', {})}
              className="btn btn-warning"
              title="Return to Launch"
              disabled={!connected}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Edit Mode Indicator */}
        {editMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="glass-panel px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
              <span>
                {editMode === 'waypoint' ? 'Click on map to add waypoint' : 'Draw survey area'}
              </span>
              <button
                onClick={() => setEditMode(null)}
                className="ml-2 text-slate-400 hover:text-white"
              >
                ESC
              </button>
            </div>
          </div>
        )}

        {/* Default Altitude Input */}
        {editMode === 'waypoint' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="glass-panel px-4 py-2 flex items-center gap-2">
              <span className="text-sm text-slate-400">Altitude:</span>
              <input
                type="number"
                value={defaultAltitude}
                onChange={(e) => setDefaultAltitude(Number(e.target.value))}
                className="input w-20 text-sm"
              />
              <span className="text-sm text-slate-400">m</span>
            </div>
          </div>
        )}

        {/* Telemetry HUD */}
        <div className="absolute bottom-4 left-4 z-[1000]">
          <TelemetryPanel />
        </div>

        {/* Action Bar */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <ActionBar />
        </div>
      </div>

      {/* Waypoint Panel */}
      <WaypointPanel />
    </div>
  );
};

export default MapView;
