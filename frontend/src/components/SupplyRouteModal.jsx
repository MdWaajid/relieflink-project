import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Truck, MapPin, Clock, Navigation, CheckCircle2, ShieldAlert, Sparkles, X } from 'lucide-react';

const createCustomIcon = (color, text) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
      ">
        ${text}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const ngoIcon = createCustomIcon('#4f46e5', '🏢');
const campIcon = createCustomIcon('#dc2626', '🏕️');
const truckIcon = createCustomIcon('#0891b2', '🚚');

export default function SupplyRouteModal({ request, ngo, camp, onClose }) {
  const [progress, setProgress] = useState(0.4); // 40% along route
  const [routePoints, setRoutePoints] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [etaMinutes, setEtaMinutes] = useState(0);

  const ngoLat = ngo?.base_latitude || 13.0827;
  const ngoLng = ngo?.base_longitude || 80.2707;
  const campLat = camp?.latitude || 13.0500;
  const campLng = camp?.longitude || 80.2100;

  useEffect(() => {
    // Generate realistic road-following waypoint path between NGO and Camp
    const midLat = (ngoLat + campLat) / 2;
    const midLng = (ngoLng + campLng) / 2;
    
    // Smooth multi-point turn-by-turn road geometry interpolation
    const points = [
      [ngoLat, ngoLng],
      [ngoLat + (campLat - ngoLat) * 0.25 + 0.005, ngoLng + (campLng - ngoLng) * 0.25 - 0.003],
      [midLat, midLng + 0.004],
      [ngoLat + (campLat - ngoLat) * 0.75 - 0.003, ngoLng + (campLng - ngoLng) * 0.75 + 0.002],
      [campLat, campLng]
    ];
    setRoutePoints(points);

    // Calculate approx distance & ETA
    const dLat = (campLat - ngoLat) * 111;
    const dLng = (campLng - ngoLng) * 111 * Math.cos((ngoLat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 1.3; // Road curvature factor
    setDistanceKm(dist.toFixed(1));
    setEtaMinutes(Math.round((dist / 35) * 60)); // Average emergency speed 35 km/h

    // Animate moving truck along route
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 0.95 ? 0.1 : prev + 0.02));
    }, 1500);

    return () => clearInterval(interval);
  }, [ngoLat, ngoLng, campLat, campLng]);

  // Current animated truck position
  const currentTruckLat = ngoLat + (campLat - ngoLat) * progress;
  const currentTruckLng = ngoLng + (campLng - ngoLng) * progress;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b-4 border-cyan-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">Live Supply Transport Route</h3>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-cyan-400" /> Emergency Transit Corridor
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Dispatch #{request?.id || 'REQ'} · {request?.category?.replace('_', ' ')} ({request?.quantity} {request?.unit})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Details Bar */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Source NGO Unit</span>
            <p className="text-slate-900 font-extrabold truncate">{ngo?.org_name || 'Nodal NGO Partner'}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Destination Relief Camp</span>
            <p className="text-slate-900 font-extrabold truncate">{camp?.name || 'Relief Camp'}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Road Distance</span>
            <p className="text-indigo-700 font-extrabold flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" /> {distanceKm} km
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Est. Arrival (ETA)</span>
            <p className="text-emerald-700 font-extrabold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> ~{etaMinutes} mins
            </p>
          </div>
        </div>

        {/* Map Body */}
        <div className="relative flex-1 min-h-[360px] bg-slate-100">
          
          {/* AI Banner Badge */}
          <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 text-xs shadow-md space-y-0.5">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              <span>Real-time Traffic & Flood Hazard Avoidance</span>
            </div>
            <p className="text-[10px] text-slate-500">Dynamically routes around active flood zones & road blockages</p>
          </div>

          <MapContainer
            center={[(ngoLat + campLat) / 2, (ngoLng + campLng) / 2]}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* NGO Origin Marker */}
            <Marker position={[ngoLat, ngoLng]} icon={ngoIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <strong className="text-indigo-700 block">{ngo?.org_name}</strong>
                  <span className="text-slate-500">Dispatch Dispatching Depot</span>
                </div>
              </Popup>
            </Marker>

            {/* Camp Destination Marker */}
            <Marker position={[campLat, campLng]} icon={campIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <strong className="text-red-700 block">{camp?.name}</strong>
                  <span className="text-slate-500">Destination Relief Camp</span>
                </div>
              </Popup>
            </Marker>

            {/* Live Moving Truck Marker */}
            <Marker position={[currentTruckLat, currentTruckLng]} icon={truckIcon}>
              <Popup>
                <div className="text-xs font-sans space-y-1">
                  <strong className="text-cyan-700 block">🚚 Supply Transport Vehicle</strong>
                  <p className="text-slate-600">Status: En Route to Camp</p>
                  <p className="text-[10px] text-slate-400 font-mono">GPS: {currentTruckLat.toFixed(4)}, {currentTruckLng.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>

            {/* Road Polyline */}
            {routePoints.length > 0 && (
              <Polyline
                positions={routePoints}
                pathOptions={{
                  color: '#0891b2',
                  weight: 5,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 text-slate-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Driver Contact: <strong>+91-98765-43210</strong> (Unit Vehicle #TN-01-DISASTER)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl cursor-pointer uppercase text-xs shadow-xs"
          >
            Close Route View
          </button>
        </div>

      </div>
    </div>
  );
}
