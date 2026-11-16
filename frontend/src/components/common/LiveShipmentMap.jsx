import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { shipmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Known coordinates fallback for cities
const CITY_COORDS = {
  'san jose': [37.3382, -121.8863],
  'los angeles': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298],
  'las vegas': [36.1699, -115.1398],
  'dallas': [32.7767, -96.7970],
  'phoenix': [33.4484, -112.0740],
  'san francisco': [37.7749, -122.4194],
  'seattle': [47.6062, -122.3321],
  'new york': [40.7128, -74.0060],
  'detroit': [42.3314, -83.0458],
  'denver': [39.7392, -104.9903],
  'fresno': [36.7468, -119.7726]
};

const getCoords = (loc, fallbackCity = 'los angeles') => {
  if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' && loc.lat !== 0) {
    return [loc.lat, loc.lng];
  }
  const cityName = (loc?.city || fallbackCity).toLowerCase().trim();
  return CITY_COORDS[cityName] || CITY_COORDS['los angeles'];
};

// Create custom animated vehicle marker icon
const createVehicleIcon = (carrier, isMoving = true, status = 'in_transit') => {
  const iconEmoji = carrier?.toLowerCase().includes('air') ? '✈️' : '🚚';
  const pulseClass = isMoving ? 'map-pulse' : '';
  const badgeColor = status === 'delivered' ? '#2C5F5D' : status === 'out_for_delivery' ? '#C68642' : '#7AAE8E';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
        <div class="${pulseClass}" style="
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(14,23,20,0.92);
          border: 2px solid ${badgeColor};
          box-shadow: 0 4px 14px rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; cursor: pointer; transition: transform 0.3s ease;
        ">
          ${iconEmoji}
        </div>
        <div style="
          background: rgba(14,23,20,0.95);
          color: #F8F4EC;
          border: 1px solid ${badgeColor}66;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          font-family: monospace;
          font-weight: 700;
          margin-top: 3px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        ">
          ${carrier || 'Vehicle'}
        </div>
      </div>
    `,
    iconSize: [42, 56],
    iconAnchor: [21, 28],
    popupAnchor: [0, -28]
  });
};

const createTerminalIcon = (label, color = '#C68642') => {
  return L.divIcon({
    className: 'custom-terminal-marker',
    html: `
      <div style="
        width: 14px; height: 14px; border-radius: 50%;
        background: ${color};
        border: 2px solid #F8F4EC;
        box-shadow: 0 0 10px ${color};
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

export default function LiveShipmentMap({ onSelectShipment, onOpenQR }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const routesRef = useRef({});
  const [shipments, setShipments] = useState([]);
  const [activeCarrier, setActiveCarrier] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [speedStats, setSpeedStats] = useState({});

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of USA
    const map = L.map(mapContainerRef.current, {
      center: [37.8, -96],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap tile layer (reliable worldwide tiles)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Fetch initial shipments
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await shipmentAPI.getAll({ limit: 50 });
        if (res.data?.data) {
          setShipments(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load map shipments:', err);
      }
    };
    fetchShipments();
  }, []);

  // 3. Connect to existing Socket.io
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('⚡ LiveMap Socket connected:', socket.id);
    });

    socket.on('shipment:location', (data) => {
      if (!data || !data.id) return;

      // Update state
      setShipments(prev => {
        return prev.map(s => {
          if (s._id === data.id || s.trackingNumber === data.trackingNumber) {
            return {
              ...s,
              currentLocation: data.currentLocation || s.currentLocation,
              status: data.status || s.status
            };
          }
          return s;
        });
      });

      if (data.speed) {
        setSpeedStats(prev => ({ ...prev, [data.trackingNumber]: data.speed }));
      }

      // Smoothly update marker on the map
      const marker = markersRef.current[data.id];
      if (marker && data.currentLocation?.lat && data.currentLocation?.lng) {
        marker.setLatLng([data.currentLocation.lat, data.currentLocation.lng]);
      }
    });

    socket.on('shipment:updated', (data) => {
      setShipments(prev => prev.map(s => s._id === data.id ? { ...s, ...data } : s));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 4. Render markers and routes on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !shipments.length) return;

    // Filter shipments
    const filtered = shipments.filter(s => {
      if (activeCarrier !== 'all' && s.carrier?.toLowerCase() !== activeCarrier.toLowerCase()) return false;
      return true;
    });

    // Clear removed markers
    Object.keys(markersRef.current).forEach(id => {
      if (!filtered.find(s => s._id === id)) {
        markersRef.current[id]?.remove();
        delete markersRef.current[id];
      }
    });
    Object.keys(routesRef.current).forEach(id => {
      if (!filtered.find(s => s._id === id)) {
        routesRef.current[id]?.remove();
        delete routesRef.current[id];
      }
    });

    const boundsGroup = [];

    filtered.forEach(s => {
      const origCoord = getCoords(s.origin, 'san jose');
      const destCoord = getCoords(s.destination, 'los angeles');
      const currCoord = getCoords(s.currentLocation, s.origin?.city || 'san jose');

      boundsGroup.push(origCoord, destCoord, currCoord);

      // Route polyline (Origin -> Current -> Destination)
      if (!routesRef.current[s._id]) {
        const poly = L.polyline([origCoord, currCoord, destCoord], {
          color: s.status === 'delivered' ? '#2C5F5D' : '#C68642',
          weight: 3,
          dashArray: s.status === 'delivered' ? null : '6, 8',
          opacity: 0.75
        }).addTo(map);
        routesRef.current[s._id] = poly;
      } else {
        routesRef.current[s._id].setLatLngs([origCoord, currCoord, destCoord]);
      }

      // Origin and Destination pins
      const originMarker = L.marker(origCoord, { icon: createTerminalIcon('Origin', '#7AAE8E') })
        .bindTooltip(`Origin: ${s.origin?.city || 'Warehouse'}`, { direction: 'top', offset: [0, -6] })
        .addTo(map);

      const destMarker = L.marker(destCoord, { icon: createTerminalIcon('Destination', '#C68642') })
        .bindTooltip(`Destination: ${s.destination?.city || 'Customer'}`, { direction: 'top', offset: [0, -6] })
        .addTo(map);

      // Vehicle moving marker
      if (!markersRef.current[s._id]) {
        const marker = L.marker(currCoord, {
          icon: createVehicleIcon(s.carrier, s.status !== 'delivered', s.status)
        }).addTo(map);

        // Marker popup content
        marker.bindPopup(`
          <div style="font-family: inherit; min-width: 200px; padding: 4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-family:monospace; font-weight:700; color:#2C5F5D; font-size:13px;">${s.trackingNumber}</span>
              <span style="background:#ECE7DC; color:#182420; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:600; text-transform:uppercase;">${s.status.replace(/_/g, ' ')}</span>
            </div>
            <div style="font-size:11px; color:#555; margin-bottom:8px;">
              <div><strong>Carrier:</strong> ${s.carrier} (${s.serviceType || 'Standard'})</div>
              <div><strong>Driver:</strong> ${s.driver || 'Assigned Logistics Driver'}</div>
              <div><strong>Route:</strong> ${s.origin?.city || 'Origin'} → ${s.destination?.city || 'Destination'}</div>
              <div><strong>Live Speed:</strong> ${speedStats[s.trackingNumber] || 62} mph</div>
            </div>
            <div style="display:flex; gap:6px;">
              <button id="btn-track-${s._id}" style="
                flex:1; background:#2C5F5D; color:#fff; border:none; border-radius:6px;
                padding:6px; font-size:11px; font-weight:600; cursor:pointer;
              ">📍 Full Details</button>
              <button id="btn-qr-${s._id}" style="
                background:#C68642; color:#fff; border:none; border-radius:6px;
                padding:6px 10px; font-size:11px; font-weight:600; cursor:pointer;
              ">📱 QR</button>
            </div>
          </div>
        `);

        marker.on('popupopen', () => {
          setSelectedShipment(s);
          const trackBtn = document.getElementById(`btn-track-${s._id}`);
          if (trackBtn && onSelectShipment) {
            trackBtn.onclick = () => onSelectShipment(s);
          }
          const qrBtn = document.getElementById(`btn-qr-${s._id}`);
          if (qrBtn && onOpenQR) {
            qrBtn.onclick = () => onOpenQR(s);
          }
        });

        markersRef.current[s._id] = marker;
      } else {
        markersRef.current[s._id].setLatLng(currCoord);
      }
    });

    if (boundsGroup.length && !map.hasUserInteracted) {
      try {
        const bounds = L.latLngBounds(boundsGroup);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
      } catch (e) {
        // bounds error fallback
      }
    }
  }, [shipments, activeCarrier, onSelectShipment, onOpenQR, speedStats]);

  // Periodic simulation trigger for demo
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(async () => {
      try {
        await shipmentAPI.simulateTick();
      } catch (err) {
        // continue quietly
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const carriers = ['all', ...Array.from(new Set(shipments.map(s => s.carrier?.toLowerCase()).filter(Boolean)))];

  return (
    <div style={{ position: 'relative', width: '100%', height: '540px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(94,139,126,0.2)' }}>
      {/* Map Target Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#111A18' }} />

      {/* Floating Control HUD */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1000,
        background: 'rgba(14,23,20,0.92)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(94,139,126,0.25)',
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8F4EC' }}>Real-Time Fleet Radar</span>
          <span style={{ fontSize: 11, background: 'rgba(44,95,93,0.3)', color: '#7AAE8E', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
            {shipments.filter(s => s.status !== 'delivered').length} Active
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(94,139,126,0.2)' }} />

        {/* Carrier Filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {carriers.map(c => (
            <button
              key={c}
              onClick={() => setActiveCarrier(c)}
              style={{
                background: activeCarrier === c ? '#2C5F5D' : 'rgba(255,255,255,0.06)',
                color: activeCarrier === c ? '#F8F4EC' : 'rgba(212,207,196,0.6)',
                border: '1px solid rgba(94,139,126,0.15)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(94,139,126,0.2)' }} />

        {/* Simulation toggle */}
        <button
          onClick={() => {
            setIsSimulating(!isSimulating);
            toast.success(isSimulating ? 'Live simulation paused' : 'Live movement simulation active');
          }}
          style={{
            background: isSimulating ? 'rgba(198,134,66,0.2)' : 'rgba(255,255,255,0.06)',
            color: isSimulating ? '#C68642' : 'rgba(212,207,196,0.6)',
            border: isSimulating ? '1px solid rgba(198,134,66,0.4)' : '1px solid rgba(94,139,126,0.15)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>{isSimulating ? '🛰️ Live Motion: ON' : '⏸️ Motion: PAUSED'}</span>
        </button>
      </div>

      {/* Floating Bottom Info Pill */}
      {selectedShipment && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 1000,
          background: 'rgba(14,23,20,0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(198,134,66,0.3)',
          borderRadius: 12,
          padding: '12px 18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#7AAE8E' }}>
                {selectedShipment.trackingNumber}
              </span>
              <span style={{ fontSize: 11, background: 'rgba(198,134,66,0.15)', color: '#C68642', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                {selectedShipment.carrier} ({selectedShipment.serviceType || 'express'})
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(212,207,196,0.5)', margin: '4px 0 0' }}>
              Route: <strong style={{ color: '#F8F4EC' }}>{selectedShipment.origin?.city}</strong> → <strong style={{ color: '#F8F4EC' }}>{selectedShipment.destination?.city}</strong> · Status: <span style={{ textTransform: 'capitalize', color: '#7AAE8E' }}>{selectedShipment.status?.replace(/_/g, ' ')}</span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {onOpenQR && (
              <button onClick={() => onOpenQR(selectedShipment)} className="btn btn-secondary btn-sm">
                📱 Generate QR Label
              </button>
            )}
            {onSelectShipment && (
              <button onClick={() => onSelectShipment(selectedShipment)} className="btn btn-logistics btn-sm">
                Inspect Shipment →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global pulse animation for map icons */}
      <style>{`
        @keyframes mapPulse {
          0% { box-shadow: 0 0 0 0 rgba(122,174,142,0.7); }
          70% { box-shadow: 0 0 0 14px rgba(122,174,142,0); }
          100% { box-shadow: 0 0 0 0 rgba(122,174,142,0); }
        }
        .map-pulse {
          animation: mapPulse 2s infinite ease-out;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(14,23,20,0.97) !important;
          color: #F8F4EC !important;
          border: 1px solid rgba(94,139,126,0.3) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6) !important;
        }
        .leaflet-popup-tip {
          background: rgba(14,23,20,0.97) !important;
        }
      `}</style>
    </div>
  );
}
