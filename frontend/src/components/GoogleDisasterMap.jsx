import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Markers
const createCustomIcon = (color, text) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${text}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const campIconCritical = createCustomIcon('#f43f5e', '🏕️');
const campIconNormal = createCustomIcon('#f59e0b', '🏕️');
const ngoIcon = createCustomIcon('#6366f1', '🤝');

export default function GoogleDisasterMap({ camps = [], ngos = [], requests = [] }) {
  const centerLat = camps.length > 0 ? camps[0].latitude : 13.0827;
  const centerLng = camps.length > 0 ? camps[0].longitude : 80.2707;

  // Active supply lines between Matched/Dispatched camps and NGOs
  const activeRoutes = requests
    .filter(r => r.matched_ngo_id && ['Matched', 'Accepted', 'Dispatched'].includes(r.status))
    .map(r => {
      const camp = camps.find(c => c.id === r.camp_id);
      const ngo = ngos.find(n => n.id === r.matched_ngo_id);
      if (camp && ngo) {
        return {
          id: r.id,
          from: [camp.latitude, camp.longitude],
          to: [ngo.base_latitude, ngo.base_longitude],
          category: r.category,
          status: r.status
        };
      }
      return null;
    })
    .filter(Boolean);

  return (
    <div className="relative w-full h-[520px] rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[380px] bg-slate-100">
      
      {/* Light Glass Overlay Banner */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/80 flex items-center space-x-3 text-xs shadow-sm text-slate-900">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
          <span className="font-bold text-slate-900">Live Disaster Region Map</span>
        </div>
        <span className="text-slate-300">|</span>
        <span className="font-medium text-slate-600">
          🏕️ {camps.length} Camps · 🤝 {ngos.length} NGOs · 🚚 {activeRoutes.length} Active Routes
        </span>
      </div>

      {/* Leaflet Map Frame */}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Render Camps */}
        {camps.map((camp) => {
          const hasCritical = requests.some(r => r.camp_id === camp.id && r.priority === 'Critical');
          return (
            <Marker
              key={camp.id}
              position={[camp.latitude, camp.longitude]}
              icon={hasCritical ? campIconCritical : campIconNormal}
            >
              <Popup>
                <div className="p-1 text-slate-900 font-sans space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">{camp.name}</h4>
                  <p className="text-xs text-slate-600">
                    Population: <strong>{camp.current_population}</strong> / {camp.capacity} capacity
                  </p>
                  <div className="text-xs pt-1 border-t border-slate-100">
                    {hasCritical ? (
                      <span className="text-rose-600 font-bold">⚠️ Critical Supply Shortage</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">✓ Operational</span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render NGOs */}
        {ngos.map((ngo) => (
          <Marker
            key={ngo.id}
            position={[ngo.base_latitude, ngo.base_longitude]}
            icon={ngoIcon}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-sans space-y-1">
                <h4 className="font-bold text-sm text-indigo-700">{ngo.org_name}</h4>
                <p className="text-xs text-slate-600">
                  Service Radius: <strong>{ngo.service_radius_km} km</strong>
                </p>
                <p className="text-xs text-slate-600">Contact: {ngo.contact_info}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Active Dispatch Polyline Vectors */}
        {activeRoutes.map((route) => (
          <Polyline
            key={route.id}
            positions={[route.from, route.to]}
            pathOptions={{
              color: route.status === 'Dispatched' ? '#06b6d4' : '#6366f1',
              weight: 3,
              dashArray: route.status === 'Dispatched' ? '6, 8' : undefined,
              opacity: 0.85
            }}
          />
        ))}

      </MapContainer>
    </div>
  );
}
