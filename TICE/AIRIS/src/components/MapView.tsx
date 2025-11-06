import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';  

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

interface MapViewProps {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
}

export const MapView = ({ lat, lon, city, country }: MapViewProps) => {
  if (!lat || !lon) {
    return <p className="text-gray-400 text-center">No geolocation data available for this IP.</p>;
  }

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-gray-700 shadow-lg h-96">
      <MapContainer center={[lat, lon]} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lon]} icon={markerIcon}>
          <Popup>
            📍 <b>{city || 'Unknown City'}</b>, {country || 'Unknown Country'}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
